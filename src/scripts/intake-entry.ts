import { installIntakeResponseFeedback } from './intake-response-feedback';

if (typeof window !== 'undefined') {
  installIntakeResponseFeedback(window as Parameters<typeof installIntakeResponseFeedback>[0]);
  void import('./intake-wizard');
}
