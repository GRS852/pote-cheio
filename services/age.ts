import { MIN_AGE } from '../constants/legal';

export interface BirthDateParts { dia: string; mes: string; ano: string }

// 'AAAA-MM-DD' a partir dos campos, ou null se não for uma data real
export function buildBirthDate({ dia, mes, ano }: BirthDateParts): string | null {
  if (!dia || !mes || ano.length !== 4) return null;
  const y = Number(ano), m = Number(mes), d = Number(dia);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

function ageOn(iso: string, today = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

// Mensagem de erro para a pessoa, ou null se a data é válida e tem a idade mínima
export function birthDateError(parts: BirthDateParts): string | null {
  const iso = buildBirthDate(parts);
  if (!iso) return 'Informe uma data de nascimento válida.';
  const age = ageOn(iso);
  if (age < 0 || age > 120) return 'Informe uma data de nascimento válida.';
  if (age < MIN_AGE) return `É preciso ter ${MIN_AGE} anos ou mais para usar o Pote Cheio.`;
  return null;
}
