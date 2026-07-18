import { Component } from 'react';
import { HeartHandshake } from 'lucide-react';

interface Props { children: React.ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-boundary" role="alert">
          <div className="error-boundary-card">
            <div className="brand-mark"><HeartHandshake size={28} /></div>
            <h1>??????</h1>
            <p>?????????????????????????????????????</p>
            <div className="error-boundary-actions">
              <button onClick={() => window.location.reload()} className="auth-primary">????</button>
              <button onClick={() => { localStorage.clear(); window.location.href = '/?login=1'; }} className="auth-secondary">????????</button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
