// Importe a biblioteca qrcode-generator
//const QRCode = require('qrcode-generator');

// Função para criar a string Pix
function criarStringPix(chavePix, valor, nomeBeneficiario, cidade, identificadorTransacao, descricaoTransacao) {
  return `
    000201
    26${chavePix.length}01${chavePix}
    52040000
    530398654
    5802BR
    6009${cidade}
    5902BR
    5913${nomeBeneficiario}
    62070503${identificadorTransacao ? `62290503${identificadorTransacao}` : ''}${descricaoTransacao ? `62290503${descricaoTransacao}` : ''}
  `;
}

// Função para gerar um QR Code a partir da string Pix
// function gerarQRCode(stringPix) {
//   const tipoQRCode = QRCode(0, 'L');
//   tipoQRCode.addData(stringPix);
//   tipoQRCode.make();

//   // Exiba o QR Code (pode ser usado para gerar uma imagem)
//   console.log(tipoQRCode.createDataURL(4));
// }

// Substitua com seus próprios dados
const chavePix = '10778860477'; // Substitua pela sua chave Pix
const valor = '50.00'; // Substitua pelo valor da transação
const nomeBeneficiario = 'Rosenildo Suelytohm de Oliveira Soares'; // Substitua pelo nome do beneficiário
const cidade = 'ARCOVERDE'; // Substitua pela cidade
const identificadorTransacao = 'ID123'; // Opcional: substitua pelo identificador da transação
const descricaoTransacao = 'Pagamento de Serviços'; // Opcional: substitua pela descrição da transação

// Crie a string Pix
const stringPix = criarStringPix(chavePix, valor, nomeBeneficiario, cidade, identificadorTransacao, descricaoTransacao);

// Gere o QR Code
console.log(stringPix);
