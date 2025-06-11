import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databaseService } from '../../services/database';
import { Employee } from '../../types/Employee';
import { Item } from '../../services/database';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  FaUser,
  FaExclamationTriangle,
  FaCheckCircle,
  FaFilePdf,
  FaArrowLeft,
  FaDownload
} from 'react-icons/fa';


export function EmployeeTerm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const employeeData = await databaseService.employees.getById(id!);
      if (employeeData) {
        setEmployee(employeeData);
        // Carregar itens vinculados
        const itemsData = await Promise.all(
          (employeeData.itensVinculados ?? []).map(itemId =>
            databaseService.items.getById(itemId)
          )
        );
        setItems(itemsData.filter((item): item is Item => item !== null));
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados do colaborador. Tente novamente.');
      ;
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      setGeneratingPDF(true);

      // Criar um novo documento PDF
      const pdfDoc = await PDFDocument.create();
      let currentPage = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = currentPage.getSize();

      // Carregar fontes
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Configurar margens
      const margin = 50;
      let y = height - margin;

      // Calcular largura da área de conteúdo
      const contentWidth = width - 2 * margin;

      // Título
      const titleText = 'TERMO DE RESPONSABILIDADE DE UTILIZAÇÃO DE EQUIPAMENTOS';
      const titleSize = 14; // Reduzido o tamanho para caber
      const titleWidth = boldFont.widthOfTextAtSize(titleText, titleSize);
      currentPage.drawText(titleText, {
        x: (width / 2) - (titleWidth / 2), // Centralizado com base na largura exata
        y,
        size: titleSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= 30; // Espaço após o título

      // Texto introdutório
      const introText = [
        'A EMPREGADORA CRESCI E PERDI FRANCHISING LTDA, inscrita no CNPJ sob o nº',
        '27.767.670/0001-94, entrega neste ato, o aparelho celular, descrito, abaixo, juntamente',
        'com chip corporativo:'
      ];

      introText.forEach(line => {
        currentPage.drawText(line, {
          x: margin,
          y: y,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: contentWidth
        });
        y -= 14; // Espaçamento entre linhas do texto introdutório
      });

      y -= 20; // Espaço após o texto introdutório

      // Itens Vinculados
      // Removido o título "ITENS VINCULADOS" conforme a imagem
      // Ajustando a lista para mostrar apenas Código, Detalhes e Número de Série
      items.forEach((item) => {
        y -= 14; // Espaço antes de cada item
        const itemDetails = [
          `• Código: ${item.codigo || '-'}`, // Usando item.codigo
          `• Detalhes: ${item.detalhes || '-'}`, // Usando item.detalhes
          `• Número de Série: ${item.numero_serie || '-'}` // Usando item.numero_serie
        ];

        itemDetails.forEach(line => {
          currentPage.drawText(line, {
            x: margin + 10, // Indentação para a lista
            y,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
            maxWidth: contentWidth - 10 // Ajuste maxWidth devido à indentação
          });
          y -= 14; // Espaçamento entre linhas dos detalhes do item
        });

        y -= 5; // Espaço extra após os detalhes de cada item
      });

      y -= 20; // Espaço após a lista de itens

      // Texto de introdução às condições
      const conditionsIntro = `O aparelho será utilizado, exclusivamente, pelo EMPREGADO, ${employee?.nome?.toUpperCase() || '**NOME DO COLABORADOR**'}, que exerce a função ${employee?.cargo || 'NÃO INFORMADO'}, portador do CPF ${employee?.cpf || '**CPF DO COLABORADOR**'}, e sob sua responsabilidade, conforme as seguintes condições:`;

      const conditionsIntroLines = conditionsIntro.match(/.{1,90}(\s|$)/g) || [conditionsIntro]; // Quebra de linha aproximada
      conditionsIntroLines.forEach(line => {
        currentPage.drawText(line.trim(), {
          x: margin,
          y,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: contentWidth,
        });
        y -= 14; // Espaçamento entre linhas
      });

      y -= 15; // Espaço após a introdução às condições

      // Novas Cláusulas Numeradas
      const newClauses = [
        '1. O equipamento deverá ser utilizado ÚNICA E EXCLUSIVAMENTE a serviço da empresa', // Cláusula 1
        'tendo em vista a atividade exercida pelo EMPREGADO, supra informado.',
        '2. O EMPREGADO somente utilizará o aparelho para se comunicar através de ligação,', // Cláusula 2
        'mensagens corporativas de "WhatsApp", ou por outro meio disponível, no horário', // Continuação Cláusula 2
        'de seu expediente, devendo ser respeitado o horário comercial.', // Continuação Cláusula 2
        '3. A contratação do plano de telefonia será realizada diretamente pela empresa,', // Cláusula 3
        'ficando o EMPREGADO isento de realizar qualquer pagamento referente ao uso do', // Continuação Cláusula 3
        'aparelho.', // Continuação Cláusula 3
        '4. O EMPREGADO não poderá contratar qualquer pacote adicional, sem a prévia', // Cláusula 4
        'comunicação e autorização da EMPREGADORA.', // Continuação Cláusula 4
        '5. O EMPREGADO tem somente a POSSE do aparelho e do chip, supra informados, em', // Cláusula 5
        'razão do uso exclusivo para prestação de serviços profissionais e NÃO A', // Continuação Cláusula 5
        'PROPRIEDADE dos equipamentos, sendo, terminantemente, proibidos os', // Continuação Cláusula 5
        'empréstimos, aluguel ou cessão deste a terceiros, ou qualquer outro tipo uso, sem a', // Continuação Cláusula 5
        'prévia e expressa autorização da EMPREGADORA.', // Continuação Cláusula 5
        '6. Ao término da prestação de serviço ou do contrato individual de trabalho, o', // Cláusula 6
        'EMPREGADO se compromete a devolver o equipamento em perfeito estado de', // Continuação Cláusula 6
        'conservação, no mesmo dia em que for comunicado ou que comunique a rescisão do', // Continuação Cláusula 6
        'contrato de trabalho, ressalvados os desgastes naturais pelo uso normal dos', // Continuação Cláusula 6
        'equipamentos.', // Continuação Cláusula 6
        '7. Em caso de dano, inutilização, roubo/furto ou extravio dos equipamentos, a', // Cláusula 7
        'EMPREGADORA deverá ser, imediatamente, comunicada.', // Continuação Cláusula 7
        '8. Se os equipamentos forem danificados ou inutilizados, por dolo ou culpa, exclusiva,', // Cláusula 8
        'do EMPREGADO, em razão de uso inadequado ou mau uso, a EMPREGADORA, poderá exigir', // Continuação Cláusula 8
        'o ressarcimento no valor referente ao equipamento e/ou seus acessórios, nos exatos termos', // Continuação Cláusula 8
        'do art. 462, § 1º, da CLT.' // Continuação Cláusula 8
      ];

      newClauses.forEach(line => {
         if (y < margin + 50) { // Adiciona nova página se estiver muito perto do rodapé
          currentPage = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
         }
        currentPage.drawText(line, {
          x: margin,
          y,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: contentWidth,
        });
        y -= 14; // Espaçamento entre linhas das cláusulas
      });

      y -= 40; // Espaço antes das assinaturas

      // Assinaturas
      const signatureLine = '_____________________________';
      const signatureSize = 10;

      // Assinatura do Colaborador (esquerda)
      const employeeSignatureText = 'NOME DO COLABORADOR:';
      const employeeSignatureTextWidth = boldFont.widthOfTextAtSize(employeeSignatureText, signatureSize);
      // Desenha a linha de assinatura primeiro
       currentPage.drawText(signatureLine, {
        x: margin,
        y: y, // Posição da linha
        size: signatureSize,
        font,
        color: rgb(0, 0, 0),
      });
      // Desenha o texto da assinatura abaixo da linha
      currentPage.drawText(employeeSignatureText, {
        x: margin, // Mantém a posição horizontal
        y: y - 15, // Ajuste vertical para desenhar abaixo da linha
        size: signatureSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Assinatura da Empresa (direita)
      const companySignatureText = 'CRESCI E PERDI FRANCHISING LTDA:';
      const companySignatureTextWidth = boldFont.widthOfTextAtSize(companySignatureText, signatureSize);
      // Desenha a linha de assinatura primeiro
       currentPage.drawText(signatureLine, {
        x: width - margin - (signatureLine.length * signatureSize * 0.6), // Posição da linha (mantém alinhamento anterior)
        y: y, // Posição da linha
        size: signatureSize,
        font,
        color: rgb(0, 0, 0),
      });
      // Desenha o texto da assinatura abaixo da linha
      currentPage.drawText(companySignatureText, {
        x: width - margin - companySignatureTextWidth, // Mantém o alinhamento horizontal
        y: y - 15, // Ajuste vertical para desenhar abaixo da linha
        size: signatureSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      y -= 50; // Espaço após as linhas de assinatura

      // Local e Data
      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`; // Formato DD/MM/YYYY
      const locationAndDateText = `São José do Rio Pardo - SP   ${formattedDate}`;
      const locationAndDateWidth = font.widthOfTextAtSize(locationAndDateText, 10);

      currentPage.drawText(locationAndDateText, {
        x: (width / 2) - (locationAndDateWidth / 2), // Centralizado
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      // Salvar o PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Criar link para download
      const link = document.createElement('a');
      link.href = url;
      link.download = `termo_responsabilidade_${employee?.nome?.replace(/\s+/g, '_').toLowerCase() || 'colaborador'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('Termo de responsabilidade gerado com sucesso!');
      ;
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setError('Erro ao gerar termo de responsabilidade. Tente novamente.');
      ;
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FaExclamationTriangle className="h-5 w-5 text-red-500 mr-3" />
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <FaExclamationTriangle className="h-5 w-5 text-yellow-500 mr-3" />
              <h3 className="text-sm font-medium text-yellow-800">Colaborador não encontrado.</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-12">
        {/* Cabeçalho */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaFilePdf className="h-8 w-8 text-indigo-600 mr-3" />
              Termo de Responsabilidade
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Gere o termo de responsabilidade para o colaborador.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={() => navigate('/employees')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </button>
            <button
              onClick={generatePDF}
              disabled={generatingPDF}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaDownload className="h-4 w-4 mr-2" />
              {generatingPDF ? 'Gerando PDF...' : 'Gerar PDF'}
            </button>
          </div>
        </div>

        {/* Mensagens de Erro e Sucesso */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 shadow-sm">
            <div className="flex items-center">
              <FaExclamationTriangle className="h-5 w-5 text-red-500 mr-3" />
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 shadow-sm">
            <div className="flex items-center">
              <FaCheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        )}

        {/* Prévia do Termo (simplificada) */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Prévia do Termo de Responsabilidade
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6 text-gray-700 text-sm">
            <p className="mb-4"><strong>TERMO DE RESPONSABILIDADE DE UTILIZAÇÃO DE EQUIPAMENTOS</strong></p>
            <p className="mb-4">
              A EMPREGADORA CRESCI E PERDI FRANCHISING LTDA, inscrita no CNPJ sob o nº 27.767.670/0001-94, entrega neste ato, o aparelho celular, descrito, abaixo, juntamente com chip corporativo:
            </p>
            <ul className="list-disc list-inside mb-4">
              {items.length > 0 ? (
                items.map(item => (
                  <li key={item.id}>
                    Código: {item.codigo || '-'}, Detalhes: {item.detalhes || '-'}, Número de Série: {item.numero_serie || '-'} {/* Usando item.codigo, item.detalhes, item.numero_serie */}
                  </li>
                ))
              ) : (
                <li>Nenhum item vinculado.</li>
              )}
            </ul>
             <p className="mb-4">
               O aparelho será utilizado, exclusivamente, pelo EMPREGADO, <strong>{employee?.nome || '**NOME DO COLABORADOR**'}</strong>, que exerce a função <strong>{employee?.cargo || 'NÃO INFORMADO'}</strong>, portador do CPF <strong>{employee?.cpf || '**CPF DO COLABORADOR**'}</strong>, e sob sua responsabilidade, conforme as seguintes condições:
             </p>
            <ol className="list-decimal list-inside space-y-2 mb-4">
               <li>O equipamento deverá ser utilizado ÚNICA E EXCLUSIVAMENTE a serviço da empresa tendo em vista a atividade exercida pelo EMPREGADO, supra informado.</li>
               <li>O EMPREGADO somente utilizará o aparelho para se comunicar através de ligação, mensagens corporativas de "WhatsApp", ou por outro meio disponível, no horário de seu expediente, devendo ser respeitado o horário comercial.</li>
               <li>A contratação do plano de telefonia será realizada diretamente pela empresa, ficando o EMPREGADO isento de realizar qualquer pagamento referente ao uso do aparelho.</li>
               <li>O EMPREGADO não poderá contratar qualquer pacote adicional, sem a prévia comunicação e autorização da EMPREGADORA.</li>
               <li>O EMPREGADO tem somente a POSSE do aparelho e do chip, supra informados, em razão do uso exclusivo para prestação de serviços profissionais e NÃO A PROPRIEDADE dos equipamentos, sendo, terminantemente, proibidos os empréstimos, aluguel ou cessão deste a terceiros, ou qualquer outro tipo uso, sem a prévia e expressa autorização da EMPREGADORA.</li>
               <li>Ao término da prestação de serviço ou do contrato individual de trabalho, o EMPREGADO se compromete a devolver o equipamento em perfeito estado de conservação, no mesmo dia em que for comunicado ou que comunique a rescisão do contrato de trabalho, ressalvados os desgastes naturais pelo uso normal dos equipamentos.</li>
               <li>Em caso de dano, inutilização, roubo/furto ou extravio dos equipamentos, a EMPREGADORA deverá ser, imediatamente, comunicada.</li>
               <li>Se os equipamentos forem danificados ou inutilizados, por dolo ou culpa, exclusiva, do EMPREGADO, em razão do uso inadequado ou mau uso, a EMPREGADORA, poderá exigir o ressarcimento no valor referente ao equipamento e/ou seus acessórios, nos exatos termos do art. 462, § 1º, da CLT.</li>
            </ol>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>CRESCI E PERDI FRANCHISING LTDA: _____________________________</div>
              <div>NOME DO COLABORADOR: _____________________________</div>
            </div>

            <div className="text-center">
              São Jose do Rio Pardo - SP - <strong>{'DATA DO DIA DA GERAÇÃO DO DOCUMENTO'.replace('DATA DO DIA DA GERAÇÃO DO DOCUMENTO', new Date().toLocaleDateString('pt-BR'))}</strong>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
} 