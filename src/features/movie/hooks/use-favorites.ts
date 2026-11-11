"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useSession } from "@/features/auth/components/session-provider";
import { favoriteApi } from "@/features/movie/api";

/**
 * Ids of the signed-in user's favourite movies, shared by every heart on the page: loaded once per user
 * (`GET /favorites/movie-ids`), then kept in sync by the toggles. Public movie endpoints ignore the access token, so
 * a movie itself never says whether it is a favourite.
 */
interface State {
  /** The user the ids belong to; null = signed out or not asked yet. */
  ownerId: number | null;
  ids: ReadonlySet<number>;
  loaded: boolean;
}

const EMPTY: State = { ownerId: null, ids: new Set(), loaded: false };
let state: State = EMPTY;
const listeners = new Set<() => void>();

function setState(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function withId(ids: ReadonlySet<number>, movieId: number, favorite: boolean): ReadonlySet<number> {
  const next = new Set(ids);
  if (favorite) next.add(movieId);
  else next.delete(movieId);
  return next;
}

export function useFavorites() {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const current = useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );

  useEffect(() => {
    // Many hearts mount at once: the first one claims the load, the others see `ownerId` already set.
    if (state.ownerId === userId) return;
    setState({ ownerId: userId, ids: new Set(), loaded: false });
    if (userId === null) return;
    favoriteApi.movieIds().then(
      (ids) => state.ownerId === userId && setState({ ownerId: userId, ids: new Set([...ids, ...state.ids]), loaded: true }),
      () => state.ownerId === userId && setState({ ...state, loaded: true }),
    );
  }, [userId]);

  /** Marks / unmarks at once and saves in the background; a failed save puts the heart back and rejects. */
  const toggle = useCallback(async (movieId: number) => {
    const favorite = !state.ids.has(movieId);
    setState({ ...state, ids: withId(state.ids, movieId, favorite) });
    try {
      await (favorite ? favoriteApi.add(movieId) : favoriteApi.remove(movieId));
    } catch (error) {
      setState({ ...state, ids: withId(state.ids, movieId, !favorite) });
      throw error;
    }
    return favorite;
  }, []);

  return { ids: current.ids, loaded: current.loaded, toggle };
}
