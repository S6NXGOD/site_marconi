import type { Metadata } from "next";
import LegalShell, { LegalH2 } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o Grupo Dr. Marconi Nunes trata os dados pessoais coletados no site, conforme a LGPD.",
  alternates: { canonical: "/privacidade" },
};

const EMAIL = "contato@marconinunes.com.br";

export default function PrivacidadePage() {
  return (
    <LegalShell titulo="Política de Privacidade" atualizacao="agosto de 2026">
      <p>
        Esta Política descreve como o <strong>Grupo Dr. Marconi Nunes</strong> —
        formado por <strong>Marconi Nunes Contabilidade</strong> (CNPJ
        21.066.608/0001-99) e <strong>CONPLAN Contabilidade LTDA</strong> (CNPJ
        10.682.231/0001-86), controladores dos dados — trata as informações
        pessoais coletadas neste site, em conformidade com a Lei Geral de
        Proteção de Dados (Lei nº 13.709/2018 — LGPD).
      </p>

      <LegalH2>1. Dados que coletamos</LegalH2>
      <ul>
        <li>
          <strong>Formulário de contato:</strong> ao usar o &ldquo;Fale
          Conosco&rdquo;, coletamos nome, empresa, telefone e a descrição da sua
          necessidade — apenas o que você informa.
        </li>
        <li>
          <strong>Notificações (opcional):</strong> se você ativar os avisos do
          site, o navegador gera um identificador técnico de envio. É um canal
          anônimo, sem nome ou contato, cancelável a qualquer momento.
        </li>
        <li>
          <strong>Dados de navegação:</strong> cookies e armazenamento locais
          estritamente técnicos, necessários ao funcionamento do site e à sessão
          do painel administrativo. Não utilizamos cookies de publicidade.
        </li>
        <li>
          <strong>Medição de audiência:</strong> contamos, de forma anônima e
          agregada, as páginas abertas, se uma matéria foi lida até o fim, o
          tempo de leitura, o tipo de aparelho (celular ou computador) e o site
          de origem da visita (apenas o domínio, como google.com). Não usamos
          cookies para isso e não guardamos seu endereço IP: ele é transformado,
          junto com o navegador, num código que muda todos os dias e não pode ser
          ligado a você. Os registros são apagados após 13 meses.
        </li>
      </ul>
      <p>Não coletamos dados de pagamento neste site.</p>

      <LegalH2>2. Para que usamos</LegalH2>
      <ul>
        <li>Responder ao seu contato e conduzir tratativas comerciais.</li>
        <li>Enviar os avisos de notícias e prazos que você solicitou.</li>
        <li>Operar, manter e melhorar o site.</li>
        <li>
          Entender, em números agregados, quais conteúdos são mais úteis aos
          leitores (medição de audiência).
        </li>
      </ul>

      <LegalH2>3. Base legal</LegalH2>
      <p>
        Tratamos os dados com fundamento no <strong>consentimento</strong> (para
        as notificações), no <strong>legítimo interesse</strong> e na execução
        de <strong>diligências pré-contratuais</strong> a seu pedido (para o
        contato comercial).
      </p>

      <LegalH2>4. Compartilhamento</LegalH2>
      <p>
        Não vendemos nem cedemos seus dados. Podemos utilizar prestadores de
        infraestrutura (hospedagem e envio) que processam dados em nosso nome e
        sob nossas instruções, além de eventual cumprimento de obrigação legal
        ou ordem de autoridade competente.
      </p>

      <LegalH2>5. Retenção e segurança</LegalH2>
      <p>
        Mantemos os dados apenas pelo tempo necessário às finalidades acima ou
        ao cumprimento de obrigações legais, adotando medidas técnicas e
        organizacionais razoáveis para protegê-los.
      </p>

      <LegalH2>6. Seus direitos (LGPD)</LegalH2>
      <p>
        Você pode solicitar confirmação, acesso, correção, anonimização ou
        eliminação dos seus dados, portabilidade e a revogação do consentimento,
        escrevendo para{" "}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Para as notificações, basta
        desativá-las no próprio site ou nas configurações do navegador.
      </p>

      <LegalH2>7. Alterações</LegalH2>
      <p>
        Esta Política pode ser atualizada. A data no topo indica a última
        revisão; mudanças relevantes serão sinalizadas nesta página.
      </p>

      <LegalH2>8. Contato</LegalH2>
      <p>
        Dúvidas ou pedidos sobre seus dados: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
      </p>
    </LegalShell>
  );
}
