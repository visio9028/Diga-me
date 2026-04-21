// API SERVERLESS PARA VERCEL - 100% GRATUITO

export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Responder a requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const { method, query, body } = req;
  const pathname = req.url;
  
  console.log(`${new Date().toISOString()} - ${method} ${pathname}`);
  
  // Simular banco de dados (em produção, use banco real)
  let database = global.database || {
    surveys: [],
    responses: [],
    users: []
  };
  
  // Salvar em global para persistir entre requisições
  global.database = database;
  
  if (pathname === '/api/sync' && method === 'POST') {
    console.log('SYNC recebido:', body);
    
    const { surveys, responses, users, deviceId } = body;
    
    // Mesclar pesquisas
    if (surveys) {
      surveys.forEach(survey => {
        const existingIndex = database.surveys.findIndex(s => s.id === survey.id);
        if (existingIndex === -1) {
          database.surveys.push(survey);
          console.log(`Nova pesquisa: ${survey.title}`);
        } else {
          const existingDate = new Date(database.surveys[existingIndex].updatedAt || database.surveys[existingIndex].createdAt);
          const newDate = new Date(survey.updatedAt || survey.createdAt);
          if (newDate > existingDate) {
            database.surveys[existingIndex] = survey;
            console.log(`Pesquisa atualizada: ${survey.title}`);
          }
        }
      });
    }
    
    // Mesclar respostas
    if (responses) {
      responses.forEach(response => {
        const existingIndex = database.responses.findIndex(r => 
          r.surveyId === response.surveyId && 
          r.submittedAt === response.submittedAt &&
          r.deviceId === response.deviceId
        );
        if (existingIndex === -1) {
          database.responses.push(response);
          console.log(`Nova resposta para: ${response.surveyId}`);
        }
      });
    }
    
    // Mesclar usuários
    if (users) {
      users.forEach(user => {
        const existingIndex = database.users.findIndex(u => u.id === user.id);
        if (existingIndex === -1) {
          database.users.push(user);
          console.log(`Novo usuário: ${user.name}`);
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Dados sincronizados',
      stats: {
        surveys: database.surveys.length,
        responses: database.responses.length,
        users: database.users.length
      }
    });
    
  } else if (pathname === '/api/data' && method === 'GET') {
    res.json(database);
    
  } else if (pathname.startsWith('/api/survey/') && method === 'GET') {
    const surveyId = pathname.split('/')[3];
    const survey = database.surveys.find(s => s.id === surveyId);
    
    if (survey) {
      res.json(survey);
    } else {
      res.status(404).json({ error: 'Pesquisa não encontrada' });
    }
    
  } else if (pathname === '/api/respond' && method === 'POST') {
    const response = {
      ...body,
      id: body.id || 'response_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      submittedAt: body.submittedAt || new Date().toISOString()
    };
    
    database.responses.push(response);
    
    console.log(`Resposta recebida: ${response.surveyId}`);
    
    res.json({
      success: true,
      message: 'Resposta registrada',
      responseId: response.id
    });
    
  } else {
    res.status(404).json({ error: 'Endpoint não encontrado' });
  }
}
