/**
 * useAuth Hook
 * 
 * Re-exports useAuth from AuthContext for convenience.
 * The actual implementation is in AuthContext to share state across components.
 */

export { useAuth, AuthProvider } from '../contexts/AuthContext';
export type { User, AuthResponse, OTPResponse } from '../services/auth.service';
