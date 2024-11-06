const express = require('express');
const axios = require('axios');
const app = express();
//const PORT = 3000;
const PORT = process.env.PORT || 3000;

// Variáveis IFOOD no frontend
const clientId = '7e789ffd-0583-4928-ad71-1ff1a1938b76';
const client_secret = 'wpf1cxdsv5r005dx7qf9ybub8f6tx5jq9ojddo4fatabm3vxo88yfyfqup1mmxltn3geyfcpk6hrwacknch1bgc7kz54xha2oea';
const uid = 'aedd0fd6-a07f-426b-a071-b1b7fd5196b4';

// Variável para armazenar os itens do carrinho
let cart = [];

// Função para obter o token de autenticação
const getToken = async () => {
    try {
        const response = await axios.post(
            'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token',
            `grantType=client_credentials&clientId=${clientId}&clientSecret=${client_secret}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data.accessToken ? 'Bearer ' + response.data.accessToken : null;
    } catch (error) {
        console.error('Erro ao obter o token:', error.response ? error.response.data : error.message);
        return null;
    }
};

// Função para obter o groupId do catálogo
const getCatalogsAndGroupId = async (token) => {
    try {
        const response = await axios.get(
            `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${uid}/catalogs`,
            {
                headers: { Authorization: token }
            }
        );
        return response.data.length > 0 ? response.data[0].groupId : null;
    } catch (error) {
        console.error('Erro ao obter os dados do catálogo:', error.response ? error.response.data : error.message);
        return null;
    }
};

// Função para obter os itens do catálogo
const getSellableItems = async (token, groupId) => {
    try {
        const response = await axios.get(
            `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${uid}/catalogs/${groupId}/sellableItems`,
            {
                headers: { Authorization: token }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Erro ao obter os itens do catálogo:', error.response ? error.response.data : error.message);
        return [];
    }
};

// Função para agrupar os itens por categoria
const groupItemsByCategory = (items) => {
    return items.reduce((groups, item) => {
        const category = item.categoryName || 'Sem Categoria';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(item);
        return groups;
    }, {});
};

// Rota principal para exibir os itens do catálogo
app.get('/catalog', async (req, res) => {
    const token = await getToken();
    if (!token) return res.status(500).send('Erro ao obter o token');

    const groupId = await getCatalogsAndGroupId(token);
    if (!groupId) return res.status(500).send('Erro ao obter o groupId');

    const items = await getSellableItems(token, groupId);
    const categorizedItems = groupItemsByCategory(items);

    let htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Catálogo de Itens</title>
            <style>
                body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f0f4f7; color: #333; }
                h1 { text-align: center; color: #2ecc71; margin: 2rem 0; font-size: 2.5rem; }
                .category-container { margin: 20px 0; }
                .category-title { font-size: 1.8rem; font-weight: bold; color: #2ecc71; margin-bottom: 10px; text-transform: uppercase; }
                .catalog-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 2rem; padding: 0 20px; }
                .item-card { background-color: #fff; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); padding: 1rem; width: 250px; text-align: center; transition: transform 0.3s ease, box-shadow 0.3s ease; }
                .item-card:hover { transform: translateY(-8px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); }
                .item-name { font-weight: bold; font-size: 1.3rem; color: #333; margin-top: 10px; }
                .item-price { color: #27ae60; font-size: 1.1rem; margin: 10px 0; }
                img { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; transition: transform 0.3s ease; }
                img:hover { transform: scale(1.05); }
                .button { background-color: #2ecc71; color: white; padding: 10px 20px; text-align: center; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px; font-size: 1rem; transition: background-color 0.3s ease; }
                .button:hover { background-color: #27ae60; }
                .form-container { display: none; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); margin: 20px; }
                .form-container input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }
                .form-container button { background-color: #3498db; color: white; font-size: 1rem; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
                .form-container button:hover { background-color: #2980b9; }
                @media (max-width: 768px) {
                    .catalog-container { flex-direction: column; align-items: center; }
                    .item-card { width: 80%; }
                }
            </style>
        </head>
        <body>
            <h1>Itens Disponíveis no Catálogo</h1>
    `;

    for (let category in categorizedItems) {
        htmlContent += `
            <div class="category-container">
                <div class="category-title">${category}</div>
                <div class="catalog-container">
                    ${categorizedItems[category].map(item => `
                        <div class="item-card">
                            <img src="https://cdn.ifood.com.br/marketplace/${item.logosUrls[0]}" alt="${item.itemName}">
                            <div class="item-name">${item.itemName}</div>
                            <div>Categoria: ${item.categoryName}</div>
                            <div class="item-price">Preço: R$${item.itemPrice.value.toFixed(2)}</div>
                            <button class="button" onclick="addToCart('${item.itemId}', '${item.itemName}', ${item.itemPrice.value})">Adicionar ao Carrinho</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    htmlContent += `
        <button class="button" onclick="checkout()">Finalizar Compra</button>
        <div id="form-container" class="form-container">
            <h3>Cadastro de Cliente</h3>
            <input type="text" id="name" placeholder="Nome Completo" required />
            <input type="email" id="email" placeholder="Email" required />
            <input type="tel" id="phone" placeholder="Telefone" required />
            <button class="button" onclick="submitForm()">Enviar</button>
        </div>

        <script>
            let cart = [];
            const checkout = () => {
                if (cart.length > 0) {
                    document.getElementById('form-container').style.display = 'block';
                } else {
                    alert('Seu carrinho está vazio!');
                }
            };

            const addToCart = (itemId, itemName, itemPrice) => {
                cart.push({ itemId, itemName, itemPrice });
                alert(itemName + ' adicionado ao carrinho!');
            };

            const submitForm = () => {
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const phone = document.getElementById('phone').value;
                if (name && email && phone) {
                    alert('Pedido realizado com sucesso!');
                    cart = [];
                    document.getElementById('form-container').style.display = 'none';
                } else {
                    alert('Por favor, preencha todos os campos.');
                }
            };
        </script>
    </body>
    </html>
    `;

    res.send(htmlContent);
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
