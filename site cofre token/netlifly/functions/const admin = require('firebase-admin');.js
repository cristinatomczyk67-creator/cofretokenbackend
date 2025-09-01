const admin = require('firebase-admin');

// Acessa as credenciais da variável de ambiente que acabamos de criar
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

// Inicializa o Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// O banco de dados que a gente vai usar
const db = admin.firestore();

exports.handler = async (event, context) => {
  // Apenas aceita requisições do tipo POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Método não permitido.'
    };
  }

  try {
    const { userId, email } = JSON.parse(event.body);

    // Cria uma nova carteira para o usuário com o saldo inicial
    const newWallet = {
      userId,
      email,
      balance: 0, // Saldo inicial zero para novos usuários
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Salva a nova carteira na sua coleção 'users' no Firestore
    const docRef = db.collection('users').doc(userId);
    await docRef.set(newWallet);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Usuário registrado e carteira criada com sucesso.' }),
    };
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno do servidor.' }),
    };
  }
};
