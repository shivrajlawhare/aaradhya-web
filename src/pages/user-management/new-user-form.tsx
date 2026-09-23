import { useState } from 'react';
import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { tsr } from '../../api/client';
import { Role, ROLE_OPTIONS } from '../../contract';
import { fieldStackStyles, formStyles } from './new-user-form.styles';

// role stays '' until the operator actually picks one, so the AC's "role
// required before submit is enabled" is a real, observable gate — not
// trivially satisfied by a pre-filled default.
interface NewUserFormValues {
  name: string;
  username: string;
  password: string;
  role: Role | '';
}

interface NewUserFormProps {
  onCreated: () => void;
}

const NewUserForm = ({ onCreated }: NewUserFormProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, register, handleSubmit, reset, watch } = useForm<NewUserFormValues>({
    defaultValues: { name: '', username: '', password: '', role: '' },
  });

  const name = watch('name');
  const username = watch('username');
  const password = watch('password');
  const role = watch('role');
  const canSubmit = name.trim().length > 0 && username.trim().length > 0 && password.length > 0 && role !== '';

  const createUserMutation = tsr.createUser.useMutation({
    onSuccess: () => {
      reset();
      onCreated();
    },
    onError: (error) => {
      if (!(error instanceof Error) && error.status === 409) {
        setSubmitError(error.body.error.message);
        return;
      }
      setSubmitError('Something went wrong. Please try again.');
    },
  });

  const handleCreate = (values: NewUserFormValues) => {
    if (createUserMutation.isPending || values.role === '') {
      return;
    }
    setSubmitError(null);
    createUserMutation.mutate({
      body: {
        name: values.name,
        username: values.username,
        password: values.password,
        role: values.role,
      },
    });
  };

  return (
    <Paper component="form" onSubmit={handleSubmit(handleCreate)} noValidate sx={formStyles}>
      <Stack sx={fieldStackStyles}>
        <Typography variant="titleM" component="h2">
          New user
        </Typography>
        <TextField label="Name" fullWidth {...register('name')} />
        <TextField label="Username" fullWidth {...register('username')} />
        <TextField label="Password" type="password" fullWidth {...register('password')} />
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Role" fullWidth>
              <MenuItem value="" disabled>
                Select a role
              </MenuItem>
              {ROLE_OPTIONS.map((roleOption) => (
                <MenuItem key={roleOption} value={roleOption}>
                  {roleOption}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        {submitError && (
          <Alert severity="error">
            <Typography variant="bodyM">{submitError}</Typography>
          </Alert>
        )}
        <Button type="submit" variant="contained" disabled={!canSubmit || createUserMutation.isPending}>
          Create user
        </Button>
      </Stack>
    </Paper>
  );
};

export default NewUserForm;
