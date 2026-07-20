from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = [ROOT / "output/pdf/manual-configuracao-nfce-pet-maia.pdf", ROOT / "public/manual-configuracao-nfce-pet-maia.pdf"]
PURPLE = colors.HexColor("#8A0EEA")
INK = colors.HexColor("#172033")
MUTED = colors.HexColor("#64748B")
LIGHT = colors.HexColor("#F5EEFF")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Cover", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=27, leading=32, textColor=colors.white, alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle(name="CoverSub", parent=styles["BodyText"], fontSize=12, leading=17, textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="H1x", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=19, leading=24, textColor=PURPLE, spaceAfter=10, spaceBefore=12))
styles.add(ParagraphStyle(name="H2x", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13, leading=17, textColor=INK, spaceBefore=10, spaceAfter=6))
styles.add(ParagraphStyle(name="Bodyx", parent=styles["BodyText"], fontSize=9.5, leading=14, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name="Smallx", parent=styles["BodyText"], fontSize=8, leading=11, textColor=MUTED))
styles.add(ParagraphStyle(name="Callout", parent=styles["BodyText"], fontSize=9.5, leading=14, textColor=INK, backColor=LIGHT, borderColor=PURPLE, borderWidth=0.8, borderPadding=9, spaceAfter=10))

def p(text, style="Bodyx"):
    return Paragraph(text, styles[style])

def bullet(text):
    return Paragraph(f"<bullet>&bull;</bullet>{text}", ParagraphStyle(name="bullet_tmp", parent=styles["Bodyx"], leftIndent=14, firstLineIndent=-8, bulletIndent=5, spaceAfter=4))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#E2E8F0")); canvas.line(18*mm, 14*mm, 192*mm, 14*mm)
    canvas.setFont("Helvetica", 7.5); canvas.setFillColor(MUTED)
    canvas.drawString(18*mm, 9*mm, "PET MAIA ERP - Manual de configuração NFC-e")
    canvas.drawRightString(192*mm, 9*mm, f"Página {doc.page}")
    canvas.restoreState()

def build(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=18*mm, bottomMargin=20*mm, title="Manual de configuração NFC-e - PET MAIA ERP", author="PET MAIA ERP")
    story = []
    cover = Table([[p("PET MAIA ERP", "Cover"),], [p("Manual de configuração da NFC-e", "Cover"),], [p("Certificado digital A1, CSC, dados da empresa e cadastro fiscal dos produtos", "CoverSub"),], [Spacer(1, 14*mm)], [p("Versão 1.0 - Julho de 2026", "CoverSub")]], colWidths=[174*mm], rowHeights=[22*mm, 42*mm, 28*mm, 18*mm, 20*mm])
    cover.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),PURPLE),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("BOX",(0,0),(-1,-1),0,PURPLE),("LEFTPADDING",(0,0),(-1,-1),14*mm),("RIGHTPADDING",(0,0),(-1,-1),14*mm)]))
    story += [Spacer(1,20*mm), cover, Spacer(1,12*mm), p("Este manual orienta a preparação técnica do sistema. A classificação tributária deve ser confirmada com a contabilidade. Faça a primeira emissão sempre em homologação.", "Callout"), PageBreak()]
    story += [p("1. O que você precisa ter", "H1x"), p("Antes de configurar o ERP, confirme estes itens:"), bullet("CNPJ e Inscrição Estadual regulares no Ceará."), bullet("Credenciamento como emissor de NFC-e modelo 65 na SEFAZ-CE."), bullet("Certificado digital A1, arquivo .pfx ou .p12, contendo o CNPJ do estabelecimento ou da matriz."), bullet("Senha do certificado."), bullet("CSC (Código de Segurança do Contribuinte) e CSC ID obtidos no portal da SEFAZ-CE."), bullet("Regime tributário, série inicial e código IBGE do município."), p("O certificado, CSC e CSC ID não substituem os demais dados fiscais. Todos são necessários para formar, assinar e autorizar a nota.", "Callout")]
    story += [p("2. Credenciamento e CSC na SEFAZ-CE", "H1x"), p("1. Acesse o portal oficial da NFC-e do Ceará e confira o credenciamento do estabelecimento."), p("2. Entre na área de serviços com a credencial exigida pela SEFAZ."), p("3. Gere ou consulte o CSC de homologação e anote também o CSC ID correspondente."), p("4. Só depois dos testes autorizados, gere/ative as credenciais de produção."), p("Links oficiais:", "H2x"), p("Portal NFC-e CE: https://nfce.sefaz.ce.gov.br/pages/informacoes/manual_configuracao.jsf", "Smallx"), p("Credenciamento: https://nfce.sefaz.ce.gov.br/pages/credenciamento.jsf", "Smallx")]
    story += [p("3. Configuração no PET MAIA ERP", "H1x"), p("Acesse <b>Configurações &gt; NFC-e (cupom fiscal)</b> com um usuário administrador."), bullet("Preencha Inscrição Estadual, UF e código IBGE do município."), bullet("Selecione o regime tributário informado pela contabilidade."), bullet("Mantenha o ambiente em Homologação (testes)."), bullet("Informe a série NFC-e. Não altere a numeração após iniciar a emissão sem orientação."), bullet("Selecione o certificado A1, digite a senha, o CSC e o CSC ID; clique em Validar e salvar credenciais."), p("Segurança: o ERP armazena o certificado em área privada e protege senha/CSC no servidor. Nunca envie esses dados por WhatsApp ou e-mail comum.", "Callout")]
    story += [PageBreak(), p("4. Cadastro fiscal dos produtos", "H1x"), p("No PDV, abra <b>Produtos &gt; Novo produto</b> ou edite um produto existente. O selo 'Fiscal completo' aparece somente quando todos os campos abaixo são válidos."), Table([[p("Campo","H2x"),p("Formato","H2x"),p("Como preencher","H2x")],[p("NCM"),p("8 dígitos"),p("Classificação fiscal da mercadoria")],[p("CFOP"),p("4 dígitos"),p("Operação indicada pela contabilidade")],[p("Origem"),p("0 a 8"),p("Origem nacional/importada da mercadoria")],[p("CSOSN / CST"),p("2 ou 3 dígitos"),p("Código conforme regime tributário")],[p("Unidade"),p("Ex.: UN, KG"),p("Unidade comercial usada na venda")],[p("Código de barras"),p("GTIN ou código interno"),p("Identificação do item no PDV")]], colWidths=[30*mm,35*mm,109*mm], repeatRows=1, style=[("BACKGROUND",(0,0),(-1,0),LIGHT),("TEXTCOLOR",(0,0),(-1,0),PURPLE),("GRID",(0,0),(-1,-1),0.4,colors.HexColor("#CBD5E1")),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)]), Spacer(1,5*mm), p("Não copie CFOP, NCM ou CSOSN/CST de outro produto sem validação. Um código incompatível pode causar rejeição ou tributação incorreta.", "Callout")]
    story += [PageBreak(), p("5. Checklist antes do primeiro teste", "H1x")]
    checks = ["Empresa: razão social, CNPJ, IE, endereço, UF e município conferidos", "Regime tributário e série confirmados", "Certificado A1 dentro da validade e senha testada", "CSC e CSC ID do ambiente correto", "Todos os produtos do teste com selo Fiscal completo", "Ambiente definido como Homologação", "Venda de teste com forma de pagamento e totais conferidos", "XML autorizado e DANFE/QR Code validados"]
    for item in checks: story.append(p(f"[ ] {item}"))
    story += [p("6. Homologação e produção", "H1x"), p("Faça vendas de teste no ambiente de homologação e trate todas as rejeições antes de usar produção. Os documentos de homologação não têm valor fiscal. A mudança para produção deve ocorrer somente após validação do contador e do responsável pela empresa."), p("7. Problemas comuns", "H1x"), p("<b>Certificado recusado:</b> confira arquivo, senha, validade e CNPJ."), p("<b>CSC inválido:</b> confira se CSC e CSC ID pertencem ao mesmo ambiente."), p("<b>Produto fiscal pendente:</b> edite o produto e complete NCM, CFOP, origem, CSOSN/CST e unidade."), p("<b>Rejeição tributária:</b> não tente códigos aleatórios; encaminhe a rejeição e os dados do item à contabilidade."), p("<b>Numeração/série:</b> preserve a sequência e solicite orientação antes de corrigir duplicidade ou inutilização."), p("8. Referências oficiais", "H1x"), p("Manual de Orientação do Contribuinte (MOC) 7.0: https://www.confaz.fazenda.gov.br/legislacao/arquivo-manuais/moc7-anexo-i-leiaute-e-rv.pdf", "Smallx"), p("Manual DANFE NFC-e e QR Code: https://www.confaz.fazenda.gov.br/legislacao/arquivo-manuais/manual_de_especificacoes_tecnicas_do_danfe_nfc-e_qr_code-versao-5-0.pdf", "Smallx"), Spacer(1,5*mm), p("Este documento é um guia operacional do ERP e não substitui orientação contábil ou as regras vigentes da SEFAZ.", "Callout")]
    doc.build(story, onFirstPage=footer, onLaterPages=footer)

for output in OUTPUTS:
    build(output)
print(OUTPUTS[0])
