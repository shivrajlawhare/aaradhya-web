import { useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import aaradhyaMark from '../../assets/aaradhya-mark.svg';
import { loginBodySchema } from '../../contract';
import { DASHBOARD_PATH } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import { cardStyles, fieldStackStyles, pageStyles, wordmarkImageStyles, wordmarkStyles } from './login-page.styles';

type LoginFormValues = z.infer<typeof loginBodySchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  const { register, handleSubmit, watch } = useForm<LoginFormValues>({
    defaultValues: { username: '', password: '' },
  });

  // Native `required` isn't used here — RHF's `isValid` isn't reliably
  // accurate before the first interaction without a resolver, and this form
  // has no resolver (loginBodySchema deliberately allows an empty password —
  // see src/contract — so it can't drive this UI-only "required" gate).
  // Deriving enablement straight from the field values sidesteps both and is
  // correct from the very first render.
  const username = watch('username');
  const password = watch('password');
  const canSubmit = username.trim().length > 0 && password.length > 0;

  const loginMutation = tsr.login.useMutation({
    onSuccess: (response) => {
      login(response.body.token, response.body.user);
      navigate(DASHBOARD_PATH, { replace: true });
    },
    onError: (error) => {
      if (!(error instanceof Error) && error.status === 401) {
        setLoginError(error.body.error.message);
        return;
      }
      setLoginError('Something went wrong. Please try again.');
    },
  });

  const handleLogin = (values: LoginFormValues) => {
    // Enter-key submission calls this directly, bypassing the button's
    // `disabled` state — guard here too so a fast double-Enter can't fire a
    // second request while one is already in flight.
    if (loginMutation.isPending) {
      return;
    }
    setLoginError(null);
    loginMutation.mutate({ body: values });
  };

  return (
    <Box sx={pageStyles}>
      <Paper sx={cardStyles} component="form" onSubmit={handleSubmit(handleLogin)} noValidate>
        <Stack sx={fieldStackStyles}>
          <Box sx={wordmarkStyles}>
            <Box component="img" src={aaradhyaMark} alt="Aaradhya" sx={wordmarkImageStyles} />
          </Box>
          <TextField label="Username" autoComplete="username" fullWidth {...register('username')} />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            fullWidth
            {...register('password')}
          />
          {loginError && (
            <Alert severity="error">
              <Typography variant="bodyM">{loginError}</Typography>
            </Alert>
          )}
          <Button type="submit" variant="contained" fullWidth disabled={!canSubmit || loginMutation.isPending}>
            Log in
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LoginPage;
