'use client';

import { Component, ReactNode } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
} from '@chakra-ui/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service (e.g., Sentry)
    console.error('Error caught by boundary:', error, errorInfo);
    
    // In production, send to error tracking
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry or similar
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box minH="100vh" bg="white" py={20}>
          <Container maxW="md">
            <VStack gap={6} textAlign="center">
              <Text fontSize="6xl">⚠️</Text>
              <Heading size="xl" color="black">
                حدث خطأ غير متوقع
              </Heading>
              <Text color="gray.600">
                نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.
              </Text>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box
                  p={4}
                  bg="red.50"
                  borderRadius="lg"
                  w="full"
                  textAlign="left"
                  fontSize="sm"
                  fontFamily="mono"
                  overflow="auto"
                >
                  <Text color="red.600" fontWeight="bold" mb={2}>
                    {this.state.error.message}
                  </Text>
                  <Text color="red.500" whiteSpace="pre-wrap">
                    {this.state.error.stack}
                  </Text>
                </Box>
              )}
              <Button
                bg="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
              >
                إعادة المحاولة
              </Button>
            </VStack>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for use with hooks
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
