const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Ruta para servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// API endpoint para guardar los datos del sitio
app.post('/api/save-site-data', (req, res) => {
    try {
        const siteData = req.body;
        const jsonPath = path.join(__dirname, 'data', 'site-data.json');
        
        // Crear directorio data si no existe
        const dataDir = path.dirname(jsonPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Crear backup del archivo anterior
        if (fs.existsSync(jsonPath)) {
            const backupPath = path.join(dataDir, `site-data-backup-${Date.now()}.json`);
            fs.copyFileSync(jsonPath, backupPath);
        }
        
        // Escribir nuevos datos
        fs.writeFileSync(jsonPath, JSON.stringify(siteData, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Datos guardados correctamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error guardando datos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al guardar los datos: ' + error.message 
        });
    }
});

// API endpoint para cargar los datos del sitio
app.get('/api/load-site-data', (req, res) => {
    try {
        const jsonPath = path.join(__dirname, 'data', 'site-data.json');
        
        if (fs.existsSync(jsonPath)) {
            // Forzar recarga del archivo sin cache
            delete require.cache[jsonPath];
            const data = fs.readFileSync(jsonPath, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Archivo de datos no encontrado' 
            });
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al cargar los datos: ' + error.message 
        });
    }
});

// API endpoint para recargar contenido en el frontend
app.post('/api/reload-content', (req, res) => {
    try {
        // Este endpoint puede ser usado para notificar cambios a clientes conectados
        res.json({ 
            success: true, 
            message: 'Señal de recarga enviada',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error en la recarga: ' + error.message 
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
    console.log(`📁 Admin panel: http://localhost:${PORT}/admin/`);
    console.log(`🌐 Sitio web: http://localhost:${PORT}/`);
});