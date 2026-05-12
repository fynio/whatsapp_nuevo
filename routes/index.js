const { Router } = require('express');

const router = Router();

router.use(require('./pagina'));
router.use(require('./status'));
router.use(require('./mensajes'));
router.use(require('./contactos'));
router.use(require('./estadisticas'));
router.use(require('./ollama'));
router.use('/chats', require('./chats'));

module.exports = router;
