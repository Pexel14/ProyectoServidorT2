export function getErrorMessage(error: any): string {
  const errorMessage = error?.message || '';

  // Login/Register errors
  if (
    errorMessage.includes('Invalid login credentials') ||
    errorMessage.includes('Email not confirmed')
  ) {
    return 'Correo o contraseña incorrectos';
  }

  if (errorMessage.includes('User already registered')) {
    return 'Este correo electronico ya esta registrado';
  }

  if (errorMessage.includes('Invalid email')) {
    return 'El correo electronico no es valido';
  }

  if (errorMessage.includes('Password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }

  if (errorMessage.includes('Password is too long')) {
    return 'La contraseña es demasiado larga';
  }

  if (
    errorMessage.includes('Unable to validate email address') ||
    errorMessage.includes('Email address invalid')
  ) {
    return 'No se puede validar el correo electronico';
  }

  if (errorMessage.includes('Failed to send confirmation email')) {
    return 'No pudimos enviar el correo de confirmacion. Intenta de nuevo';
  }

  if (errorMessage.includes('Signup disabled')) {
    return 'El registro esta deshabilitado actualmente';
  }

  if (errorMessage.includes('No user found')) {
    return 'Usuario no encontrado';
  }

  // Network/Server errors
  if (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('fetch failed')
  ) {
    return 'Problema de conexion. Verifica tu internet e intenta de nuevo';
  }

  if (errorMessage.includes('500') || errorMessage.includes('Internal Server')) {
    return 'Error del servidor. Intenta de nuevo mas tarde';
  }

  // Generic fallback
  return errorMessage || 'Ocurrio un error inesperado. Intenta de nuevo';
}
