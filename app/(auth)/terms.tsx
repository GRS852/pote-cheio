import React from 'react';

import LegalPage from '../../components/LegalPage';
import { TERMS_SECTIONS } from '../../constants/legal';

export default function TermsScreen() {
  return <LegalPage title="Termos de Uso" sections={TERMS_SECTIONS} />;
}
