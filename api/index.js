// API SIMples para Vercel - Padrão automático
export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const { method, query, body } = req;
  const pathname = req.url;
  
  // Banco global
  let database = global.database || {
    surveys: [],
    responses: [],
    users: []
  };
  global.database = database;
  
  console.log(`${new Date().toISOString()} - ${method} ${pathname}`);
  
  // Rota: /api/sync
  if (pathname === '/sync' && method === 'POST') {
    const { surveys, responses, users } = body;
    
    if (surveys) {
      surveys.forEach(survey => {
        if (!database.surveys.find(s => s.id === survey.id)) {
          database.surveys.push(survey);
        }
      });
    }
    
    if (responses) {
      responses.forEach(response => {
        if (!database.responses.find(r => r.id === response.id)) {
          database.responses.push(response);
        }
      });
    }
    
    if (users) {
      users.forEach(user => {
        if (!database.users.find(u => u.id === user.id)) {
          database.users.push(user);
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
    
  // Rota: /api/data
  } else if (pathname === '/data' && method === 'GET') {
    res.json(database);
    
  // Rota: /api/survey/:id
  } else if (pathname.startsWith('/survey/') && method === 'GET') {
    const surveyId = pathname.split('/')[2];
    const survey = database.surveys.find(s => s.id === surveyId);
    
    if (survey) {
      res.json(survey);
    } else {
      res.status(404).json({ error: 'Pesquisa não encontrada' });
    }
    
  // Rota: /api/respond
  } else if (pathname === '/respond' && method === 'POST') {
    const response = {
      ...body,
      id: body.id || 'response_' + Date.now(),
      submittedAt: body.submittedAt || new Date().toISOString()
    };
    
    database.responses.push(response);
    
    res.json({
      success: true,
      message: 'Resposta registrada',
      responseId: response.id
    });
    
  } else {
    res.status(404).json({ error: 'Endpoint não encontrado' });
  }
}
