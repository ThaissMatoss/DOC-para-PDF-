// Importa os módulos necessários
const express = require('express'); // Framework para criar servidor web
const multer = require('multer'); // Middleware para lidar com uploads de arquivos
const fs = require('fs'); // Módulo para manipulação de arquivos
const mammoth = require('mammoth'); // Biblioteca para extrair texto de arquivos .docx
const PDFDocument = require('pdfkit'); // Biblioteca para criar arquivos PDF
const path = require('path'); // Módulo para trabalhar com caminhos de arquivos

// Cria uma instância do Express
const app = express();

// Configura o Multer para armazenar arquivos enviados na pasta 'uploads'
const upload = multer({ dest: 'uploads/' });

// Torna a pasta 'public' acessível como arquivos estáticos (ex: HTML, CSS)
app.use(express.static('public'));

// Rota para upload do arquivo .docx
app.post('/upload', upload.single('docxfile'), async (req, res) => {
    // Pega o caminho do arquivo enviado
    const filePath = req.file.path;

    // Define o caminho onde o PDF convertido será salvo
    const pdfPath = path.join('uploads', req.file.filename + '.pdf');

    try {
        // Extrai o texto cru do arquivo .docx usando a biblioteca mammoth
        const result = await mammoth.extractRawText({ path: filePath });

        // Cria um novo documento PDF
        const doc = new PDFDocument();

        // Cria um stream de escrita para salvar o PDF no disco
        const writeStream = fs.createWriteStream(pdfPath);

        // Direciona a saída do PDF para o arquivo no disco
        doc.pipe(writeStream);

        // Escreve o texto extraído dentro do PDF
        doc.text(result.value);

        // Finaliza o documento PDF
        doc.end();

        // Espera o PDF terminar de ser escrito para prosseguir
        writeStream.on('finish', () => {
            // Remove o arquivo .docx original do servidor
            fs.unlinkSync(filePath);

            // Envia o PDF gerado como download para o navegador
            res.download(pdfPath, 'arquivo_convertido.pdf', (err) => {
                if (err) {
                    console.error(err); // Mostra erro, se houver
                }
                // Remove o PDF do servidor após o download
                fs.unlinkSync(pdfPath);
            });
        });

    } catch (err) {
        // Em caso de erro durante a conversão:
        fs.unlinkSync(filePath); // Remove o arquivo .docx
        console.error(err); // Exibe o erro no console
        res.status(500).send('Erro ao converter arquivo.'); // Responde com erro 500
    }
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
