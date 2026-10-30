import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Pending } from "@/components/Pending";
import { site } from "@/config/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Política de Privacidade",
  description: "Como a Ledesma Advocacia trata os dados pessoais informados no site, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).",
  path: "/politica-de-privacidade",
});

/** Texto-base para revisão do escritório antes da publicação. */
export default function PrivacidadePage() {
  return (
    <>
      <PageHero eyebrow="Privacidade" title="Política de Privacidade" crumbs={[{ name: "Política de Privacidade", path: "/politica-de-privacidade" }]}>
        <p>Informações sobre o tratamento de dados pessoais neste site, nos termos da Lei nº 13.709/2018 (LGPD).</p>
      </PageHero>
      <section className="bg-ink py-20">
        <div className="container-site prose-ledesma max-w-3xl text-paper">
          <h2 className="!mt-0">Controlador</h2>
          <p>
            {site.razaoSocial}
            {site.cnpj ? `, CNPJ ${site.cnpj}` : ""}.
          </p>
          {!site.cnpj && <Pending label="CNPJ do controlador" />}
          <p>
            Contato para assuntos de privacidade: {site.email ? `${site.email}, ` : ""}pelo WhatsApp dos advogados ou presencialmente nas sedes, conforme
            indicado na <Link href="/contato">página de contato</Link>.
          </p>

          <h2>Quais dados são tratados</h2>
          <p>
            O formulário de contato coleta nome, telefone e mensagem e, opcionalmente, e-mail e cidade. Esses dados não são armazenados pelo site: ao enviar,
            o próprio navegador abre o WhatsApp com a mensagem preenchida, e o envio só acontece quando o usuário o confirma no aplicativo.
          </p>
          <p>Ao clicar nos links de WhatsApp, telefone, mapas ou redes sociais, o usuário é direcionado a serviços de terceiros, que possuem políticas próprias.</p>

          <h2>Finalidade</h2>
          <p>Os dados enviados ao escritório são utilizados exclusivamente para responder ao contato e, se houver contratação, para a prestação dos serviços jurídicos.</p>

          <h2>Sigilo</h2>
          <p>As informações recebidas são protegidas pelo sigilo profissional, nos termos do Estatuto da Advocacia (Lei nº 8.906/1994) e do Código de Ética e Disciplina da OAB.</p>

          <h2>Cookies</h2>
          <p>Este site não utiliza cookies de publicidade ou de rastreamento.</p>
          {site.estatisticasToken && (
            <p>
              Para saber quantas pessoas visitam o site e quais páginas são mais acessadas, usamos o Cloudflare Web Analytics, que não utiliza cookies,
              não armazena dados no seu navegador e não identifica o visitante. As informações são apenas estatísticas agregadas.
            </p>
          )}

          <h2>Direitos do titular</h2>
          <p>
            O titular pode solicitar confirmação do tratamento, acesso, correção, eliminação e demais direitos previstos no art. 18 da LGPD, pelos canais de contato
            do escritório.
          </p>
        </div>
      </section>
    </>
  );
}
