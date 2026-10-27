import { BaseRepository } from './base.repository';

/**
 * Authentication Repository.
 * Foundation for authentication, token management, and session API integration.
 * Concrete methods and payload contracts will be added during the Auth module integration phase.
 */
export class AuthRepository extends BaseRepository {
  // Method signatures will be implemented when integrating Auth APIs
}

export const authRepository = new AuthRepository();
