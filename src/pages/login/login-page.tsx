import { useState } from 'react';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Alert, Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import type { z } from 'zod';
import { tsr } from '../../api/client';
import aaradhyaLockupLight from '../../assets/aaradhya-lockup-light.png';
import loginHeroPanelDecorDark from '../../assets/decor/login-hero-panel-dark.svg';
import loginHeroPanelDecor from '../../assets/decor/login-hero-panel.svg';
import rosette from '../../assets/decor/rosette.svg';
import sparkle from '../../assets/decor/sparkle.svg';
import squiggle from '../../assets/decor/squiggle.svg';
import toranOnDarkDark from '../../assets/decor/toran-on-dark-dark.svg';
import toranOnDark from '../../assets/decor/toran-on-dark.svg';
import logoMarkLight from '../../assets/logo-mark-light.svg';
import logoMark from '../../assets/logo-mark.svg';
import { ILLUSTRATIONS } from '../../components/ui/illustrations';
import ThemedImage from '../../components/ui/themed-image';
import { loginBodySchema } from '../../contract';
import { DASHBOARD_PATH } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import {
  bandArtStyles,
  bandLockupStyles,
  bandSparkleStyles,
  bandToranStyles,
  cardStyles,
  fieldStackStyles,
  formPanelStyles,
  formSparkleStyles,
  headingStyles,
  headlineStyles,
  heroArtFrameStyles,
  heroArtStyles,
  heroBandStyles,
  heroDecorStyles,
  heroPanelStyles,
  logoMarkFrameStyles,
  logoMarkStyles,
  mobileAccentsStyles,
  pageStyles,
  rosetteStyles,
  squiggleStyles,
  subtitleStyles,
} from './login-page.styles';

type LoginFormValues = z.infer<typeof loginBodySchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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

  // The approved show/hide eye (UI-12): focus order Username → Password →
  // eye → Log in.
  let passwordType = 'password';
  let passwordToggleLabel = 'Show password';
  let passwordToggleIcon = <VisibilityOutlinedIcon />;
  if (isPasswordVisible) {
    passwordType = 'text';
    passwordToggleLabel = 'Hide password';
    passwordToggleIcon = <VisibilityOffOutlinedIcon />;
  }
  const passwordToggle = (
    <InputAdornment position="end">
      <IconButton
        aria-label={passwordToggleLabel}
        edge="end"
        onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
      >
        {passwordToggleIcon}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box sx={pageStyles}>
      <Box sx={heroPanelStyles}>
        <ThemedImage light={loginHeroPanelDecor} dark={loginHeroPanelDecorDark} sx={heroDecorStyles} />
        <Box sx={heroArtFrameStyles}>
          <ThemedImage {...ILLUSTRATIONS['login-hero']} sx={heroArtStyles} />
        </Box>
        <Typography variant="displayXl" component="p" sx={headlineStyles}>
          {'Every celebration,\nbeautifully planned.'}
        </Typography>
      </Box>

      <Box sx={heroBandStyles}>
        <ThemedImage light={toranOnDark} dark={toranOnDarkDark} sx={bandToranStyles} />
        <Box component="img" src={aaradhyaLockupLight} alt="Aaradhya" sx={bandLockupStyles} />
        <ThemedImage {...ILLUSTRATIONS['login-hero']} sx={bandArtStyles} />
        <Box component="img" src={sparkle} alt="" aria-hidden sx={bandSparkleStyles} />
      </Box>

      <Box sx={formPanelStyles}>
        <Box component="img" src={sparkle} alt="" aria-hidden sx={formSparkleStyles} />
        <Box sx={cardStyles} component="form" onSubmit={handleSubmit(handleLogin)} noValidate>
          <Stack sx={fieldStackStyles}>
            <Box sx={logoMarkFrameStyles}>
              <ThemedImage light={logoMark} dark={logoMarkLight} alt="Aaradhya" sx={logoMarkStyles} />
            </Box>
            <Box sx={headingStyles}>
              <Typography variant="h2" component="h1">
                Welcome back
              </Typography>
              <Typography variant="bodyL" sx={subtitleStyles}>
                Log in to continue
              </Typography>
            </Box>
            <TextField label="Username" autoComplete="username" fullWidth {...register('username')} />
            <TextField
              label="Password"
              type={passwordType}
              autoComplete="current-password"
              fullWidth
              slotProps={{ input: { endAdornment: passwordToggle } }}
              {...register('password')}
            />
            {loginError && (
              <Alert severity="error">
                <Typography variant="bodyM">{loginError}</Typography>
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={!canSubmit || loginMutation.isPending}
            >
              Log in
            </Button>
          </Stack>
        </Box>
        <Box sx={mobileAccentsStyles} aria-hidden>
          <Box component="img" src={squiggle} alt="" sx={squiggleStyles} />
          <Box component="img" src={rosette} alt="" sx={rosetteStyles} />
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
