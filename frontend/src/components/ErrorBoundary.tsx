import React from 'react';

type State = { hasError: boolean };

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
    state = {hasError: false};

    static getDerivedStateFromError(_: any): State {
        return {hasError: true};
    }

    render() {
        if (this.state.hasError) {
            return <div className="p-4 text-red-500">Something went wrong.</div>;
        }
        return this.props.children;
    }
}

export default ErrorBoundary;