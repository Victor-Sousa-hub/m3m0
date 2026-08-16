import { createContext, useContext } from 'react';
import type { User } from '../types/models';

const UserContext = createContext<User | null>(null);

export const UserProvider = UserContext.Provider;

export function useCurrentUser(): User {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error('useCurrentUser must be used within a UserProvider with a signed-in user');
  }
  return user;
}
