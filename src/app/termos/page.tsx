import type { Metadata } from "next";
import LegalShell, { LegalH2 } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Condições de uso do site do Grupo Dr. Marconi Nunes: conteúdo informativo, propriedade intelectual e responsabilidades.",
  alternates: { canonical: "/termos" },
};

const EMAIL = "contato@marconinunes.com.br";

export default function TermosPage() {
  return (
    <LegalShell titulo="Termos de Uso" atualizacao="agosto de 2026">
      <p>
        Ao acessar e utilizar o site do <strong>Grupo Dr. Marconi Nunes</strong>{" "}
        — marca que reúne <strong>Marconi Nunes Contabilidade</strong> (CNPJ
        21.066.608/0001-99) e <strong>CONPLAN Contabilidade LTDA</strong> (CNPJ
        10.682.231/0001-86) —, você concorda com estes Termos de Uso. Se não
        concordar, por favor não utilize o site.
      </p>

      <LegalH2>1. Objeto</LegalH2>
      <p>
        Este é o portal institucional e informativo do Grupo, que reúne a
        CONPLAN (gestão pública) e a Marconi Nunes Contabilidade (setor
        privado), com notícias, calendário de prazos, áreas de atuação e canais
        de contato.
      </p>

      <LegalH2>2. Caráter informativo</LegalH2>
      <p>
        O conteúdo tem finalidade informativa e <strong>não substitui</strong> a
        consultoria contábil, fiscal ou jurídica individualizada. Prazos,
        obrigações e regras podem mudar; confirme sempre na fonte oficial antes
        de agir. Não nos responsabilizamos por decisões tomadas exclusivamente
        com base no conteúdo do site.
      </p>

      <LegalH2>3. Conteúdo de terceiros</LegalH2>
      <p>
        Algumas notícias são reproduzidas de outras fontes, sempre com{" "}
        <strong>crédito e link para a origem</strong>. Os direitos pertencem aos
        respectivos titulares, e o conteúdo de terceiros não reflete
        necessariamente a opinião do Grupo.
      </p>

      <LegalH2>4. Propriedade intelectual</LegalH2>
      <p>
        As marcas &ldquo;Grupo Dr. Marconi Nunes&rdquo;, &ldquo;Marconi Nunes
        Contabilidade&rdquo; e &ldquo;CONPLAN&rdquo;, os logotipos e o conteúdo
        produzido pelo Grupo são protegidos e não podem ser reproduzidos sem
        autorização.
      </p>

      <LegalH2>5. Uso adequado</LegalH2>
      <p>
        Você concorda em não utilizar o site para fins ilícitos, nem tentar
        comprometer sua segurança, disponibilidade ou integridade.
      </p>

      <LegalH2>6. Links externos</LegalH2>
      <p>
        O site pode conter links para páginas de terceiros, sobre os quais não
        temos controle e pelos quais não nos responsabilizamos.
      </p>

      <LegalH2>7. Alterações</LegalH2>
      <p>
        Estes Termos podem ser atualizados a qualquer momento. A data no topo
        indica a última revisão.
      </p>

      <LegalH2>8. Legislação e foro</LegalH2>
      <p>
        Estes Termos são regidos pela legislação brasileira. Fica eleito o foro
        da Comarca de Teresina/PI para dirimir eventuais questões.
      </p>

      <LegalH2>9. Contato</LegalH2>
      <p>
        Dúvidas sobre estes Termos: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
      </p>
    </LegalShell>
  );
}
