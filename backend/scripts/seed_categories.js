const fs = require('fs');
const path = require('path');
const { getDatabase } = require('../database/db');

const seedData = [
    {
        name: 'Moradia',
        type: 'despesa',
        essential: 1,
        subcategories: [
            { name: 'Aluguel / Financiamento', essential: 1 },
            { name: 'Condomínio', essential: 1 },
            { name: 'Energia Elétrica', essential: 1 },
            { name: 'Água e Esgoto', essential: 1 },
            { name: 'Gás', essential: 1 },
            { name: 'Internet / TV / Telefone', essential: 0 },
            { name: 'IPTU', essential: 1 },
            { name: 'Seguro Residencial', essential: 0 },
            { name: 'Manutenção e Reparos', essential: 0 }
        ]
    },
    {
        name: 'Alimentação',
        type: 'despesa',
        essential: 1,
        subcategories: [
            { name: 'Supermercado / Feira', essential: 1 },
            { name: 'Restaurantes / Lanches', essential: 0 },
            { name: 'Delivery', essential: 0 },
            { name: 'Padaria / Cafés', essential: 0 }
        ]
    },
    {
        name: 'Mobilidade e Transporte',
        type: 'despesa',
        essential: 1,
        subcategories: [
            { name: 'Combustível', essential: 1 },
            { name: 'Prestação do Veículo', essential: 1 },
            { name: 'Seguro Auto', essential: 1 },
            { name: 'IPVA e Licenciamento', essential: 1 },
            { name: 'Manutenção e Lavagem', essential: 1 },
            { name: 'Estacionamento e Pedágio', essential: 0 },
            { name: 'Aplicativos e Táxi', essential: 0 },
            { name: 'Transporte Público', essential: 1 }
        ]
    },
    {
        name: 'Saúde e Bem-estar',
        type: 'despesa',
        essential: 1,
        subcategories: [
            { name: 'Plano de Saúde', essential: 1 },
            { name: 'Farmácia e Medicamentos', essential: 1 },
            { name: 'Consultas e Exames', essential: 1 },
            { name: 'Academia / Esportes', essential: 0 },
            { name: 'Terapia / Psicologia', essential: 0 }
        ]
    },
    {
        name: 'Educação',
        type: 'despesa',
        essential: 0,
        subcategories: [
            { name: 'Mensalidades', essential: 1 },
            { name: 'Cursos Livres e Idiomas', essential: 0 },
            { name: 'Material Escolar e Livros', essential: 0 }
        ]
    },
    {
        name: 'Lazer e Entretenimento',
        type: 'despesa',
        essential: 0,
        subcategories: [
            { name: 'Assinaturas', essential: 0 },
            { name: 'Cinema, Teatro e Shows', essential: 0 },
            { name: 'Viagens e Passeios', essential: 0 },
            { name: 'Bares e Baladas', essential: 0 },
            { name: 'Hobbies e Jogos', essential: 0 }
        ]
    },
    {
        name: 'Cuidados Pessoais',
        type: 'despesa',
        essential: 0,
        subcategories: [
            { name: 'Roupas e Calçados', essential: 0 },
            { name: 'Salão de Beleza / Barbearia', essential: 0 },
            { name: 'Cosméticos e Higiene Pessoal', essential: 0 }
        ]
    },
    {
        name: 'Pets',
        type: 'despesa',
        essential: 0,
        subcategories: [
            { name: 'Ração e Petiscos', essential: 1 },
            { name: 'Veterinário e Vacinas', essential: 1 },
            { name: 'Banho e Tosa', essential: 0 }
        ]
    },
    {
        name: 'Despesas Financeiras',
        type: 'despesa',
        essential: 1,
        subcategories: [
            { name: 'Imposto de Renda', essential: 1 },
            { name: 'Taxas Bancárias e Anuidades', essential: 0 },
            { name: 'Juros / Multas', essential: 0 }
        ]
    },
    {
        name: 'Investimentos',
        type: 'despesa',
        essential: 0,
        subcategories: [
            { name: 'Renda Fixa', essential: 0 },
            { name: 'Renda Variável', essential: 0 },
            { name: 'Previdência Privada', essential: 0 },
            { name: 'Reserva de Emergência', essential: 0 }
        ]
    },
    {
        name: 'Outros (Despesas)',
        type: 'despesa',
        essential: 0,
        subcategories: [
            { name: 'Presentes', essential: 0 },
            { name: 'Doações', essential: 0 }
        ]
    },
    {
        name: 'Salário',
        type: 'receita',
        essential: 1,
        subcategories: []
    },
    {
        name: 'Renda Extra',
        type: 'receita',
        essential: 0,
        subcategories: []
    },
    {
        name: 'Rendimentos',
        type: 'receita',
        essential: 0,
        subcategories: []
    },
    {
        name: 'Vendas',
        type: 'receita',
        essential: 0,
        subcategories: []
    },
    {
        name: 'Outros (Receitas)',
        type: 'receita',
        essential: 0,
        subcategories: []
    },
    {
        name: 'Transferências Internas',
        type: 'transferencia',
        essential: 0,
        subcategories: [
            { name: 'Aplicação em Investimento', essential: 0 },
            { name: 'Resgate de Investimento', essential: 0 }
        ]
    }
];

function runSeed() {
    const db = getDatabase();
    console.log('Starting category seeds...');

    const deleteTransactionsCategoriesStmt = db.prepare('UPDATE transactions SET category_id = NULL');
    const deleteCategoriesStmt = db.prepare('DELETE FROM categories');

    const insertCategoryStmt = db.prepare(
        'INSERT INTO categories (name, type, essential, parent_id) VALUES (?, ?, ?, ?)'
    );

    const seedTransaction = db.transaction(() => {
        // 1. Unlink categories from transactions before deleting
        deleteTransactionsCategoriesStmt.run();
        console.log('Unlinked existing categories from transactions.');

        // 2. Delete all categories
        deleteCategoriesStmt.run();
        console.log('Deleted existing categories.');

        // 3. Insert new seeds
        for (const parent of seedData) {
            const parentResult = insertCategoryStmt.run(parent.name, parent.type, parent.essential, null);
            const parentId = parentResult.lastInsertRowid;
            console.log(`Created parent category: ${parent.name} (ID: ${parentId})`);

            if (parent.subcategories && parent.subcategories.length > 0) {
                for (const sub of parent.subcategories) {
                    const subResult = insertCategoryStmt.run(sub.name, parent.type, sub.essential, parentId);
                    console.log(`  - Created subcategory: ${sub.name} (ID: ${subResult.lastInsertRowid})`);
                }
            }
        }
    });

    try {
        seedTransaction();
        console.log('Seed completed successfully!');
    } catch (err) {
        console.error('Error seeding categories:', err);
    }
}

runSeed();
