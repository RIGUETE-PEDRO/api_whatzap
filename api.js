import pkg from 'whatsapp-web.js';
const { Client, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';
const estadosUsuarios = {}; // Define um objeto para armazenar os estados dos usuários
import { Document, Packer, Paragraph, TextRun } from "docx";
//import { exec } from 'child_process';


// Inicializa o cliente WhatsApp
const client = new Client();

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot está pronto!');
});

client.initialize();

;

async function gerarDocumentoPedido(chatId) {
    const pedido = estadosUsuarios[chatId].carrinho.map(item => `- ${item}`).join('\n');
    const detalhesCliente = estadosUsuarios[chatId].detalhesCliente || {};

    const doc = new Document({
        creator: "SeuNome",  // Adicione seu nome ou nome da empresa aqui
        title: "Pedido de Cliente",
        description: "Documento com o resumo do pedido do cliente.",
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Pedido do Cliente",
                                bold: true,
                                size: 24, // Tamanho da fonte: 12pt
                            }),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(`Nome: ${detalhesCliente.nome || ''}\n`),
                            new TextRun(`Endereço: ${detalhesCliente.endereco || ''}\n`),
                            new TextRun(`Número da Casa: ${detalhesCliente.numeroCasa || ''}\n`),
                            new TextRun(`Ponto de Referência: ${detalhesCliente.referencia || ''}\n`),
                            new TextRun(`Número de Telefone: ${detalhesCliente.telefone || ''}\n`),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("\n"),
                            new TextRun({
                                text: pedido,
                                size: 20, // Tamanho da fonte: 10pt para o corpo do texto
                                font: "Arial",
                            }),
                        ],
                    }),
                ],
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    const directoryPath = 'C:/Users/omega/Downloads/api2/pedidos/';
    const fileName = gerarNomeArquivo(); // Gera nome do arquivo aleatório
    const filePath = path.join(directoryPath, fileName);
    
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
    }
    
    // Garantindo que o arquivo seja fechado corretamente após a escrita
    fs.writeFile(filePath, buffer, err => {
        if (err) {
            console.error(`Erro ao salvar o arquivo: ${err}`);
            throw err;
        }
        console.log(`Arquivo salvo em: ${filePath}`);
    });
    return filePath;
}

const bebidas = [
    " - Refrigerante 2 Litros",
    " - Refrigerante 1 1/2 Litros",
    " - Refrigerante Coca 1 Litro",
    " - Refrigerante 600ml",
    " - Refrigerante Lata",
    " - Água Mineral",
    " - Água Mineral com Gás",
    " - Copo Suco (Laranja, Acerola, Abacaxi, Abacaxi com Hortelã, Maracujá)",
    " - Copo de Suco Polpa (Caju, Morango, Graviola, Goiaba)",
    " - Jarro de 750ml de Laranja",
    " - Jarro de 1 Litro 1/2 de Laranja",
    " - Jarro de 750ml de Polpa",
    " - Jarro de 1 Litro 1/2 de Polpa"
];

// Adiciona as opções de pizza doce
const pizzasDoces = [
    ' - Nutela com Morango',
    ' - Romeu e Julieta',
    ' - Banana com Canela'
];

const saboresBorda = [
    ' - Catupiry',
    ' - Cheddar'
];

// Listas de produtos
const produtosPorcao = [
    '1 - Batata Frita 500g com Queijo',
    '2 - Torresmo 300g com Mandioca',
    '3 - Torresmo 300g',
    '4 - Mandioca 300g',
    '5 - Batata Frita 500g',
    '6 - Batata Frita 500g com Cheddar e Bacon',
    '7 - Filé de Tilápia 600g',
    '8 - Linguiça de Porco 500g',
    '9 - Salaminho, Azeitona, Ovo de Codorna, Queijo Prato e Palmito',
    '10 - Costela ao Molho Barbecue com Batatas Rústicas',
    '11 - Alcatra 500g, Batata Frita 500g, Palmito, Azeitona e Ovo de Codorna'
];

const produtosPizza = [
    ' - Frango',
    ' - Frango com Catupiry',
    ' - Calabresa',
    ' - Portuguesa',
    ' - Quatro Queijos',
    ' - Roma',
    ' - Marguerita',
    ' - Da Casa',
    ' - Bacon com Catupiry',
    ' - Bacon com Calabresa',
    ' - Vegetariana',
    ' - Pão de alho',
    ' - Costela ao molho barbecue',
    ' - Atum',
    ' - Doces',
];

function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

async function enviarCardapio(chatId) {
    const pastaImagens = 'C:/Users/omega/Downloads/api2/img'; // Caminho das imagens
    const imagens = fs.readdirSync(pastaImagens); // Lista de arquivos na pasta

    // Ordena as imagens em ordem alfabética
    imagens.sort();

    // Verifica se há imagens disponíveis
    if (imagens.length > 0) {
        let mensagemCardapio = 'Aqui estão as opções disponíveis:\n\n';

        for (const imagem of imagens) {
            const caminhoImagem = path.join(pastaImagens, imagem);
            const media = MessageMedia.fromFilePath(caminhoImagem);
            await client.sendMessage(chatId, media); 
        }

        await client.sendMessage(chatId, mensagemCardapio);
    } else {
        await client.sendMessage(chatId, 'Nenhuma imagem encontrada na pasta.');
    }
}

// Função principal que trata as mensagens recebidas
client.on('message', async msg => {
    if (msg.isGroup) {
        // Se for uma mensagem de um grupo, ignora
        return;
    }

    const chatId = msg.from;
    const resposta = msg.body;

    // Inicializa o estado do usuário se não existir
    if (!estadosUsuarios[chatId]) {
        estadosUsuarios[chatId] = { etapa: 'inicial', carrinho: [] };
    }

    console.log(`Mensagem recebida de ${chatId}: ${resposta}`);

    switch (estadosUsuarios[chatId].etapa) {
        case 'inicial':
            await enviarMensagemInicial(chatId);
            break;

        case 'esperando_opcao':
            await processarOpcaoInicial(chatId, resposta);
            break;

        case 'esperando_pedido':
            await processarPedido(chatId, resposta);
            break;

        case 'escolhendo_pizza':
            await processarEscolhaPizza(chatId, resposta);
            break;

        case 'escolhendo_pizza_doce':
            await processarPizzaDoce(chatId, resposta);
            break;

        case 'meio_a_meio':
            await processarMeioAMeio(chatId, resposta);
            break;

        case 'escolhendo_segundo_sabor':
            await processarSegundoSabor(chatId, resposta);
            break;

        case 'escolhendo_tamanho':
            await processarTamanho(chatId, resposta);
            break;

        case 'escolhendo_borda':
            await processarBorda(chatId, resposta);
            break;

        case 'adicionando_bebida':
            await processarEscolhaBebida(chatId, resposta);
            break;

        case 'escolhendo_bebida':
            await processarBebida(chatId, resposta);
            break;

        case 'escolhendo_sabor_bebida':
            await processarSaborBebida(chatId, resposta);
            break;

        case 'escolhendo_quantidade':
            await processarQuantidade(chatId, resposta);
            break;

        case 'adicionando_mais':
            await processarEscolhaMais(chatId, resposta);
            break;

        case 'pegando_nome':
            await pegarNome(chatId, resposta);
            break;

        case 'pegando_endereco':
            await pegarEndereco(chatId, resposta);
            break;

        case 'pegando_numero_casa':
            await pegarNumeroCasa(chatId, resposta);
            break;

        case 'pegando_referencia':
            await pegarReferencia(chatId, resposta);
            break;

        default:
            await client.sendMessage(chatId, 'Desculpe, não entendi sua resposta. Por favor, tente novamente.');
            break;
    }
});

// Funções específicas para modularizar o código
async function enviarMensagemInicial(chatId) {
    const mensagemInicial = `Olá! Bem-vindo ao nosso sistema de pedidos. Por favor, escolha uma opção:\n\n1. Fazer um pedido\n2. Falar com o atendente`;
    await client.sendMessage(chatId, mensagemInicial);
    estadosUsuarios[chatId].etapa = 'esperando_opcao';
}


async function processarOpcaoInicial(chatId, resposta) {
    const respostaNormalizada = normalizarTexto(resposta);
    if (respostaNormalizada === '1') {
        await client.sendMessage(chatId, 'Você escolheu fazer o pedido! Aqui estão as opções disponíveis:');
        await enviarCardapio(chatId);
        await client.sendMessage(chatId, 'Escolha o que você deseja pedir:\n1. Pizza\n2. Lanche\n3. Porção\n4. Bebidas');
        estadosUsuarios[chatId].etapa = 'esperando_pedido';
    } else if (respostaNormalizada === '2') {
        await client.sendMessage(chatId, 'Você escolheu falar com o atendente. Um atendente estará disponível em breve.');
        const mensagemAtendente = `O cliente com o número ${chatId} precisa de atendimento.`;
        await client.sendMessage(numeroAtendente, mensagemAtendente);
        estadosUsuarios[chatId].etapa = 'inativo';
    } else {
        await client.sendMessage(chatId, 'Opção inválida. Por favor, digite 1 ou 2.');
    }
}


async function processarPedido(chatId, resposta) {
    const respostaNormalizada = normalizarTexto(resposta);
    switch (respostaNormalizada) {
        case '1':
            await enviarOpcoesPizzas(chatId);
            estadosUsuarios[chatId].etapa = 'escolhendo_pizza';
            break;
        case '2':
            await client.sendMessage(chatId, 'Você escolheu Lanche! Qual tipo deseja?');
            estadosUsuarios[chatId].etapa = 'escolhendo_lanche';
            break;
        case '3':
            await enviarOpcoesPorcoes(chatId);
            estadosUsuarios[chatId].etapa = 'escolhendo_porcao';
            break;
        case '4':
            await enviarOpcoesBebidas(chatId);
            estadosUsuarios[chatId].etapa = 'escolhendo_bebida';
            break;
        default:
            await client.sendMessage(chatId, 'Opção inválida. Por favor, escolha 1, 2 ou 3.');
            break;
    }
}

async function enviarOpcoesPizzas(chatId) {
    const mensagemPizza = 'Aqui estão as opções de pizza:\n\n' + produtosPizza.map((pizza, index) => `${index + 1}. ${pizza}`).join('\n');
    await client.sendMessage(chatId, mensagemPizza);
}
async function enviarOpcoesPorcoes(chatId) {
    const mensagemPorcao = 'Aqui estão as opções de porções:\n\n' + produtosPorcao.map((porcao, index) => `${index + 1}. ${porcao}`).join('\n');
    await client.sendMessage(chatId, mensagemPorcao);
}

async function processarEscolhaPizza(chatId, resposta) {
    const respostaNormalizada = parseInt(normalizarTexto(resposta));
    const pizzaEscolhida = produtosPizza[respostaNormalizada - 1];

    if (pizzaEscolhida) {
        if (respostaNormalizada === 15) { // Verifica se é a opção de pizza doce
            await client.sendMessage(chatId, 'Você escolheu a pizza doce. Qual sabor você deseja?\n' + pizzasDoces.map((sabor, index) => `${index + 1}. ${sabor}`).join('\n'));
            estadosUsuarios[chatId].etapa = 'escolhendo_pizza_doce';
        } else {
            estadosUsuarios[chatId].pizzaEscolhida = pizzaEscolhida; // Armazena o sabor escolhido
            await client.sendMessage(chatId, `Você escolheu: ${pizzaEscolhida}. Deseja meio a meio com outro sabor? (Responda "sim" ou "não")`);
            estadosUsuarios[chatId].etapa = 'meio_a_meio';
        }
    } else {
        await client.sendMessage(chatId, 'Opção inválida. Por favor, escolha uma opção válida.');
    }
}

async function processarPizzaDoce(chatId, resposta) {
    const respostaNormalizada = parseInt(normalizarTexto(resposta));
    const saborEscolhido = pizzasDoces[respostaNormalizada - 1];

    if (saborEscolhido) {
        estadosUsuarios[chatId].pizzaEscolhida = `Pizza Doce: ${saborEscolhido}`; // Armazena o sabor escolhido
        await client.sendMessage(chatId, `Você escolheu a pizza doce: ${saborEscolhido}. Qual tamanho você deseja?\n1. Pequena\n2. Média\n3. Grande\n4. Extra Grande`);
        estadosUsuarios[chatId].etapa = 'escolhendo_tamanho';
    } else {
        await client.sendMessage(chatId, 'Sabor inválido. Por favor, escolha um sabor válido.');
    }
}

async function processarMeioAMeio(chatId, resposta) {
    const escolha = reconhecerSimNao(resposta);
    if (escolha === 'sim') {
        await client.sendMessage(chatId, 'Qual o segundo sabor que você deseja?');
        estadosUsuarios[chatId].etapa = 'escolhendo_segundo_sabor';
    } else if (escolha === 'não') {
        await client.sendMessage(chatId, 'Quantas unidades deseja adicionar?');
        estadosUsuarios[chatId].etapa = 'escolhendo_quantidade';
    } else {
        await client.sendMessage(chatId, 'Resposta inválida. Responda "sim" ou "não".');
    }
}


async function processarSegundoSabor(chatId, resposta) {
    const respostaNormalizada = parseInt(normalizarTexto(resposta));
    const segundoSabor = produtosPizza[respostaNormalizada - 1];

    if (segundoSabor) {
        estadosUsuarios[chatId].pizzaEscolhida = `Meio a meio: ${estadosUsuarios[chatId].pizzaEscolhida} e ${segundoSabor}`;
        await client.sendMessage(chatId, `Você escolheu os sabores: ${estadosUsuarios[chatId].pizzaEscolhida}. Qual tamanho você deseja?\n1. Pequena\n2. Média\n3. Grande\n4. Extra Grande`);
        estadosUsuarios[chatId].etapa = 'escolhendo_tamanho';
    } else {
        await client.sendMessage(chatId, 'Opção inválida. Por favor, escolha uma opção válida.');
    }
}


async function processarTamanho(chatId, resposta) {
    const respostaNormalizada = parseInt(normalizarTexto(resposta));
    const tamanhos = ['Pequena', 'Média', 'Grande', 'Extra Grande'];

    if (respostaNormalizada > 0 && respostaNormalizada <= tamanhos.length) {
        const tamanhoEscolhido = tamanhos[respostaNormalizada - 1];
        estadosUsuarios[chatId].carrinho.push(`${tamanhoEscolhido}: ${estadosUsuarios[chatId].pizzaEscolhida}`);
        await client.sendMessage(chatId, `Você escolheu o tamanho: ${tamanhoEscolhido}. Quantas unidades deseja adicionar?`);
        estadosUsuarios[chatId].etapa = 'escolhendo_quantidade';
    } else {
        await client.sendMessage(chatId, 'Tamanho inválido. Por favor, escolha um número entre 1 e 4.');
    }
}


async function processarBorda(chatId, resposta) {
    const respostaNormalizada = parseInt(normalizarTexto(resposta));
    const bordas = ['Catupiry', 'Cheddar'];
    
    if (respostaNormalizada > 0 && respostaNormalizada <= bordas.length) {
        const bordaEscolhida = bordas[respostaNormalizada - 1];
        estadosUsuarios[chatId].carrinho.push(`Borda: ${bordaEscolhida}`);
        await client.sendMessage(chatId, `Você escolheu borda: ${bordaEscolhida}. Deseja adicionar uma bebida? (Responda "sim" ou "não")`);
        estadosUsuarios[chatId].etapa = 'adicionando_bebida';
    } else {
        await client.sendMessage(chatId, 'Borda inválida. Por favor, escolha um número entre 1 e 2.');
    }
}

async function processarQuantidade(chatId, resposta) {
    const quantidade = parseInt(normalizarTexto(resposta));
    const produtoNome = estadosUsuarios[chatId].pizzaEscolhida || estadosUsuarios[chatId].produtoTemporario; // Adiciona uma verificação para o produto

    if (quantidade > 0 && produtoNome) {
        for (let i = 0; i < quantidade; i++) {
            estadosUsuarios[chatId].carrinho.push(produtoNome);
        }
        await client.sendMessage(chatId, `Você adicionou ${quantidade}x ${produtoNome} ao seu carrinho.`);
        await client.sendMessage(chatId, 'Deseja adicionar mais alguma coisa? (Responda "sim" ou "não")');
        estadosUsuarios[chatId].etapa = 'adicionando_mais';
    } else {
        await client.sendMessage(chatId, 'Quantidade inválida ou produto não definido. Por favor, tente novamente.');
    }
}



async function finalizarPedido(chatId) {
    await client.sendMessage(chatId, `Seu pedido foi finalizado! Você escolheu:\n\n${estadosUsuarios[chatId].carrinho.join('\n')}`);
    estadosUsuarios[chatId] = { etapa: 'inicial', carrinho: [] }; // Redefine o estado do usuário
}

async function enviarOpcoesBebidas(chatId) {
    const mensagemBebidas = 'Aqui estão as opções de bebidas:\n\n' + bebidas.map((bebida, index) => `${index + 1}. ${bebida}`).join('\n');
    await client.sendMessage(chatId, mensagemBebidas);
    estadosUsuarios[chatId].etapa = 'escolhendo_bebida';
}

async function processarEscolhaMais(chatId, resposta) {
    const escolha = reconhecerSimNao(resposta);
    if (escolha === 'sim') {
        await reiniciarEscolha(chatId);
    } else if (escolha === 'não') {
        await confirmarPedido(chatId);
    } else {
        await client.sendMessage(chatId, 'Resposta inválida. Responda sim ou não.');
    }
}

// Função para reiniciar a escolha de produtos
async function reiniciarEscolha(chatId) {
    await client.sendMessage(chatId, 'Escolha o que você deseja pedir:\n1. Pizza\n2. Lanche\n3. Porção\n4. Bebidas');
    estadosUsuarios[chatId].etapa = 'esperando_pedido';
}



function reconhecerSimNao(resposta) {
    const respostaNormalizada = normalizarTexto(resposta);
    const opcoesSim = ['sim', 's', 'yes', 'y', 'ssim', 'si', 'siim', 'simmm', 'yep', 'ya'];
    const opcoesNao = ['não', 'nao', 'n', 'no', 'naao', 'naoo', 'nãao', 'naooo', 'nope'];

    if (opcoesSim.includes(respostaNormalizada)) return 'sim';
    if (opcoesNao.includes(respostaNormalizada)) return 'não';
    return null;
}

async function processarBebida(chatId, resposta) {
    const respostaNormalizada = parseInt(normalizarTexto(resposta));
    const bebidaEscolhida = bebidas[respostaNormalizada - 1];

    if (bebidaEscolhida) {
        estadosUsuarios[chatId].bebidaEscolhida = respostaNormalizada;
        if (respostaNormalizada === 8 || respostaNormalizada === 9) { // Itens que precisam de sabor adicional
            const bebidaSemParenteses = bebidaEscolhida.split('(')[0].trim();
            estadosUsuarios[chatId].produtoTemporario = bebidaSemParenteses; 
            await client.sendMessage(chatId, `Qual sabor você deseja para a bebida: ${bebidaSemParenteses}?`);
            estadosUsuarios[chatId].etapa = 'escolhendo_sabor_bebida';
        } else {
            estadosUsuarios[chatId].produtoTemporario = bebidaEscolhida; 
            await client.sendMessage(chatId, `Você escolheu a bebida: ${bebidaEscolhida}. Quantas unidades deseja adicionar?`);
            estadosUsuarios[chatId].etapa = 'escolhendo_quantidade';
        }
    } else {
        await client.sendMessage(chatId, 'Opção inválida. Por favor, escolha uma opção válida.');
    }
}


async function confirmarPedido(chatId) {
    if (!estadosUsuarios[chatId].detalhesCliente) {
        estadosUsuarios[chatId].detalhesCliente = {};
    }
    const numeroTelefone = chatId; // Captura o número de telefone do chatId
    estadosUsuarios[chatId].detalhesCliente.telefone = numeroTelefone; // Adiciona ao estado

    const filePath = await gerarDocumentoPedido(chatId);
    await client.sendMessage(chatId, `Seu pedido foi finalizado! Você escolheu:\n\n${estadosUsuarios[chatId].carrinho.join('\n')}`);
    await client.sendMessage(chatId, `O pedido foi salvo como um arquivo no caminho: ${filePath}`);
    estadosUsuarios[chatId] = { etapa: 'inicial', carrinho: [] }; // Redefine o estado do usuário

    // Apenas salvar no dispositivo por enquanto
    return filePath;
}




async function perguntarDetalhesCliente(chatId) {
    await client.sendMessage(chatId, 'Por favor, informe seu nome:');
    estadosUsuarios[chatId].etapa = 'pegando_nome';
}

async function pegarNome(chatId, resposta) {
    if (!estadosUsuarios[chatId].detalhesCliente) {
        estadosUsuarios[chatId].detalhesCliente = {};
    }
    estadosUsuarios[chatId].detalhesCliente.nome = resposta;
    await client.sendMessage(chatId, 'Por favor, informe seu endereço:');
    estadosUsuarios[chatId].etapa = 'pegando_endereco';
}

async function pegarEndereco(chatId, resposta) {
    if (!estadosUsuarios[chatId].detalhesCliente) {
        estadosUsuarios[chatId].detalhesCliente = {};
    }
    estadosUsuarios[chatId].detalhesCliente.endereco = resposta;
    await client.sendMessage(chatId, 'Por favor, informe o número da casa:');
    estadosUsuarios[chatId].etapa = 'pegando_numero_casa';
}

async function pegarNumeroCasa(chatId, resposta) {
    if (!estadosUsuarios[chatId].detalhesCliente) {
        estadosUsuarios[chatId].detalhesCliente = {};
    }
    estadosUsuarios[chatId].detalhesCliente.numeroCasa = resposta;
    await client.sendMessage(chatId, 'Por favor, informe um ponto de referência:');
    estadosUsuarios[chatId].etapa = 'pegando_referencia';
}

async function pegarReferencia(chatId, resposta) {
    if (!estadosUsuarios[chatId].detalhesCliente) {
        estadosUsuarios[chatId].detalhesCliente = {};
    }
    estadosUsuarios[chatId].detalhesCliente.referencia = resposta;
    await confirmarPedido(chatId);  // Chama a função para confirmar e finalizar o pedido
}


function gerarNomeArquivo() {
    const timestamp = new Date().getTime();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `pedido_${timestamp}_${randomSuffix}.docx`;
}



async function processarSaborBebida(chatId, resposta) {
    const bebida = estadosUsuarios[chatId].produtoTemporario;
    estadosUsuarios[chatId].produtoTemporario = `${bebida} de ${resposta}`;
    await client.sendMessage(chatId, `Você escolheu a bebida: ${bebida} com sabor ${resposta}. Quantas unidades deseja adicionar?`);
    estadosUsuarios[chatId].etapa = 'escolhendo_quantidade';
}
//esta dando erro no endereço pizza de nutella repetindo 3 vezes