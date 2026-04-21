// API para Vercel - pasta api/
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const { method, query, body } = req;
  const pathname = req.url;
  
  // Banco de dados global
  let database = global.database || {
    surveys: [],
    responses: [],
    users: []
  };
  global.database = database;
  
  if (pathname === '/sync' && method === 'POST') {
    const { surveys, responses, users, deviceId } = body;
    
    if (surveys) {
      surveys.forEach(survey => {
        const existingIndex = database.surveys.findIndex(s => s.id === survey.id);
        if (existingIndex === -1) {
          database.surveys.push(survey);
        }
      });
    }
    
    if (responses) {
      responses.forEach(response => {
        const existingIndex = database.responses.findIndex(r => 
          r.surveyId === response.surveyId && 
          r.submittedAt === response.submittedAt
        );
        if (existingIndex === -1) {
          database.responses.push(response);
        }
      });
    }
    
    if (users) {
      users.forEach(user => {
        const existingIndex = database.users.findIndex(u => u.id === user.id);
        if (existingIndex === -1) {
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
    
  } else if (pathname === '/data' && method === 'GET') {
    res.json(database);
    
  } else if (pathname.startsWith('/survey/') && method === 'GET') {
    const surveyId = pathname.split('/')[2];
    const survey = database.surveys.find(s => s.id === surveyId);
    
    if (survey) {
      res.json(survey);
    } else {
      res.status(404).json({ error: 'Pesquisa não encontrada' });
    }
    
  } else if (pathname === '/respond' && method === 'POST') {
    const response = {
      ...body,
      id: body.id || 'response_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
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
