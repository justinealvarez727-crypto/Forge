/**
 * Error boundary. React only catches render/lifecycle errors in class components.
 * Used twice: once at the app root (last resort) and once around each route, so a
 * crash in one page leaves the navigation usable. `resetKey` clears the error when
 * the route changes so the user is never stuck on a stale error screen.
 */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { reportError } from '@/lib/perf';
import { Button } from './ui';

interface Props {
  children: ReactNode;
  resetKey?: string;
  /** Compact variant for route-level boundaries. */
  inline?: boolean;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, info.componentStack ?? undefined);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="card mx-auto my-10 max-w-md space-y-3 p-6 text-center">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted">
          This screen hit an unexpected error. Your saved prompts and progress are safe in your browser.
        </p>
        <pre className="max-h-28 overflow-auto rounded-md bg-raised p-2 text-left text-xs text-muted">
          {this.state.error.message}
        </pre>
        <div className="flex justify-center gap-2">
          <Button variant="primary" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
          {!this.props.inline && <Button onClick={() => location.reload()}>Reload app</Button>}
        </div>
      </div>
    );
  }
}
