import { MercadoPagoConfig, Preference } from 'mercadopago';

// Esta é a função que o Netlify irá executar.
exports.handler = async (event) => {
  // O corpo da requisição é um JSON; então, precisamos parseá-lo.
  const { amount, payer_email } = JSON.parse(event.body);

  // Validação básica para garantir que os dados necessários foram enviados.
  if (!amount || !payer_email) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        ok: false,
        error: 'Valor e e-mail são obrigatórios.'
      })
    };
  }

  // Configura o cliente do Mercado Pago usando a variável de ambiente.
  const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN, // Certifique-se que o nome da variável está correto
    options: { timeout: 5000 }
  });

  // Cria uma nova instância da classe Preference.
  const preference = new Preference(client);

  try {
    // Corpo da requisição para o Mercado Pago.
    const preferenceBody = {
      items: [
        {
          title: 'Compra de CofreToken',
          quantity: 1,
          unit_price: Number(amount),
          currency_id: 'BRL'
        }
      ],
      payer: {
        email: payer_email
      },
      back_urls: {
        success: 'https://www.cofretoken.com.br/#comprar',
        failure: 'https://www.cofretoken.com.br/#comprar',
        pending: 'https://www.cofretoken.com.br/#comprar'
      },
      auto_return: 'approved',
      // Adiciona o tipo de ponto de interação para gerar o Pix.
      point_of_interaction: {
        type: 'ADDITIONAL_INFO',
        // O Mercado Pago retornará os dados Pix neste objeto
        transaction_data: {} 
      }
    };

    // Cria a preferência de pagamento.
    const result = await preference.create({ body: preferenceBody });

    // A resposta da API do Mercado Pago contém os dados do Pix.
    // Retorna a resposta de sucesso com os dados necessários para o frontend.
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        id: result.id,
        init_point: result.init_point,
        sandbox_init_point: result.sandbox_init_point,
        // Retorna a chave Pix Copia e Cola e o URL do QR Code.
        pix_code: result.point_of_interaction.transaction_data.qr_code,
        pix_url: result.point_of_interaction.transaction_data.qr_code_base64
      })
    };
  } catch (error) {
    // Em caso de erro, exibe a mensagem no console do Netlify e retorna um erro para o frontend.
    console.error('Erro ao criar preferência:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: 'Falha no servidor ao criar preferência.'
      })
    };
  }
};
