// API Super Simples para Vercel
export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { method, url } = req;
  
  // Banco em memória global
  if (!global.database) {
    global.database = {
      surveys: [],
      responses: [],
      users: []
    };
  }
  
  const db = global.database;
  
  // Log para debug
  console.log(`${new Date().toISOString()} - ${method} ${url}`);
  
  // Rota: /api/data
  if (url === '/data' && method === 'GET') {
    return res.json(db);
  }
  
  // Rota: /api/sync
  if (url === '/sync' && method === 'POST') {
    req.body.surveys?.forEach(survey => {
      if (!db.surveys.find(s => s.id === survey.id)) {
        db.surveys.push(survey);
        console.log('Nova pesquisa:', survey.title);
      }
    });
    
    req.body.responses?.forEach(response => {
      if (!db.responses.find(r => r.id === response.id)) {
        db.responses.push(response);
        console.log('Nova resposta:', response.surveyId);
      }
    });
    
    req.body.users?.forEach(user => {
      if (!db.users.find(u => u.id === user.id)) {
        db.users.push(user);
        console.log('Novo usuário:', user.name);
      }
    });
    
    return res.json({
      success: true,
      message: 'Sincronizado',
      stats: {
        surveys: db.surveys.length,
        responses: db.responses.length,
        users: db.users.length
      }
    });
  }
  
  // Outras rotas
  if (url.startsWith('/survey/') && method === 'GET') {
    const id = url.split('/')[2];
    const survey = db.surveys.find(s => s.id === id);
    return survey ? res.json(survey) : res.status(404).json({ error: 'Não encontrado' });
  }
  
  if (url === '/respond' && method === 'POST') {
    const response = { ...req.body, id: 'resp_' + Date.now() };
    db.responses.push(response);
    return res.json({ success: true, responseId: response.id });
  }
  
  // 404
  res.status(404).json({ error: 'Rota não encontrada', url, method });
}
