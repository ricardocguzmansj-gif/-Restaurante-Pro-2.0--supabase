
export const formatCurrency = (amount: number, currency: string = 'ARS'): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) {
        return `hace ${Math.floor(interval)} años`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return `hace ${Math.floor(interval)} meses`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return `hace ${Math.floor(interval)} días`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return `hace ${Math.floor(interval)} horas`;
    }
    interval = seconds / 60;
    if (interval > 1) {
        return `hace ${Math.floor(interval)} min`;
    }
    return `hace ${Math.floor(seconds)} seg`;
};