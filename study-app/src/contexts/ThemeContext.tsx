import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme, PaletteMode } from '@mui/material';
import { CssBaseline } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as PaletteMode) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light mode colors
                primary: {
                  main: '#667eea',
                  light: '#8099f0',
                  dark: '#5568d3',
                },
                secondary: {
                  main: '#764ba2',
                  light: '#916ec4',
                  dark: '#653a8b',
                },
                background: {
                  default: '#f5f7fa',
                  paper: '#ffffff',
                },
                success: {
                  main: '#4caf50',
                  light: '#e8f5e9',
                },
                error: {
                  main: '#f44336',
                  light: '#ffebee',
                },
                warning: {
                  main: '#ff9800',
                  light: '#fff3e0',
                },
              }
            : {
                // Dark mode colors
                primary: {
                  main: '#8099f0',
                  light: '#9eb3f5',
                  dark: '#667eea',
                },
                secondary: {
                  main: '#916ec4',
                  light: '#a88dd1',
                  dark: '#764ba2',
                },
                background: {
                  default: '#121212',
                  paper: '#1e1e1e',
                },
                success: {
                  main: '#66bb6a',
                  light: '#1b3a1d',
                },
                error: {
                  main: '#ef5350',
                  light: '#3a1c1c',
                },
                warning: {
                  main: '#ffa726',
                  light: '#3d2c1a',
                },
              }),
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h3: {
            fontWeight: 700,
            fontSize: 'clamp(1.75rem, 5vw, 3rem)',
          },
          h4: {
            fontWeight: 700,
            fontSize: 'clamp(1.5rem, 4vw, 2.125rem)',
          },
          h5: {
            fontWeight: 600,
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
          },
          h6: {
            fontWeight: 500,
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          },
          body1: {
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
          },
          body2: {
            fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
                fontWeight: 600,
                minHeight: 44, // Accessibility: minimum touch target
              },
              sizeLarge: {
                minHeight: 48,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
              },
            },
          },
          MuiToggleButton: {
            styleOverrides: {
              root: {
                minHeight: 44, // Accessibility: minimum touch target
              },
            },
          },
          MuiRadio: {
            styleOverrides: {
              root: {
                padding: 12, // Larger touch target for mobile
              },
            },
          },
          MuiFormControlLabel: {
            styleOverrides: {
              root: {
                marginLeft: -8,
                marginRight: 0,
                minHeight: 44, // Accessibility: minimum touch target
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                minHeight: 32,
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                minWidth: 44,
                minHeight: 44,
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
