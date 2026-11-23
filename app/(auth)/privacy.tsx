import React from 'react';

import LegalPage from '../../components/LegalPage';
import { PRIVACY_SECTIONS } from '../../constants/legal';

export default function PrivacyScreen() {
  return (
    <LegalPage
      title="Política de Privacidade"
      intro="Esta política explica, de forma simples, quais dados pessoais o Pote Cheio coleta, para que eles são usados, com quem são compartilhados e como você exerce os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018)."
      sections={PRIVACY_SECTIONS}
    />
  );
}
