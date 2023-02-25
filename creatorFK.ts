import * as fs from 'fs';
import { join } from 'path';
interface Relation {
	currentTable: string;
	//tabela atual
	foreignKey: string[];
	//chave fk
	relateTo: string[];
	//relação da chave fk
}

function createModifiedSqlScript(inputFile: string): string {
	const sqlScript: string = fs.readFileSync(inputFile, 'utf-8');
	//ler o arquivo .sql 
	return sqlScript
	
}

function infoTable(sql: string) {
	const relations: Relation[] = [];
	//inicia a variavel 

	const tablesLength = sql.match(/`Niruu_App`.`(.*)`/g)?.length;	
	// procura pelos nomes das tabelas usando regex, pega a quantidade de nomes das tabelas  encotradas 
	//padrão de tabela sendo procurada
	// Create Table
	// If Not Exists `Niruu_App`.`Magazine` 

	const tablesNames = sql.trim().match(/`Niruu_App`.`(.*)`/g);
	// pega os nomes das tabelas

	if (tablesLength && tablesNames) {
		for (let index = 0; index < tablesLength; index++) {
		//loop na quantitade de nomes de tabelas
			const tableName = tablesNames[index].replaceAll(/`Niruu_App`\.`/g, '').replaceAll('`', '').trim();
			//pega o primeiro nome tabela, e remove templetes string e espaços desnecessarios 
			console.log(tableName)
			const tablesRegex = /Create Table([\s\S]*?)Utf8mb4;/g
			//regex pega todas as tabelas com esse padrão 
			
			
			const columnsRegex = /,([\s\S]* ?),/g
			//regex para pega as informações dentro das colunas estiver as entre virgula, assim não seleciona a chave pk
			
			let tables = sql.trim().match(tablesRegex)?.[index];
			//seta todas as tabelas na variavel 
			//console.log('tablesRegex',tables)

			const columnsLegth = tables?.match(columnsRegex)?.length
			// seta as quantidade de colunas naa tabela
			const columns = tables?.match(columnsRegex)
			//seta todas as colunas achadas  

			console.log(columns)
			if (columnsLegth && columns) {
				//loop da tabela, lendo todas as colunas
				
				for (let index = 0; index < columnsLegth; index++) {
					//loop nas colunas da tabela
					let column = columns[index].replaceAll('`', '').trim();
					//formata a coluna, remove templetes string
					
					console.log("coluna formatada", column)


					let lines = column.split(',')
					//divide as colunas em linha separando por virgula
					console.log(lines)

					for (const line of lines) {
					//loop dentro da linha 
						let lineFormat = line.trim().split(' ');
						//formata a linha e a divide
						console.log('linha:', lineFormat)

						let isId = lineFormat[0].startsWith('Id_') ? lineFormat[0] : undefined;
						//procura se a primeira palavra da string começa com "id_", 
						//se verdadeiro retorna a linha formatada em string, se não retorna undefined
						console.log('isId:', isId)
						if (isId) {
							//se true cria a relação
							let relateTo = isId?.slice(3).trim()
							//remove 'Id_'

							console.log('relateTo:', relateTo)
							
							//adiciona as relações na tabela 
							relations.push(
								{
									foreignKey: [isId],
									relateTo: [relateTo],
									currentTable: tableName
								}
							)
						}

					}


					//console.log("relations:", relations)
				}
			}
			//console.log("for columnsLegth:", columnsLegth)

		}
	}
	return generateFK(relations, sql)
};


function generateFK(relations: Relation[], sql: string) {
	//sql: database anterior

	let querySQL = '';

	//cria o script sql
	for (const relation of relations) {
		console.log("relation generateFK:", relation)
		if (relation.foreignKey) {
			querySQL +=
				`ALTER TABLE \`${relation.currentTable}\` ADD CONSTRAINT \`Fk_${relation.currentTable}_${relation.relateTo}\` FOREIGN KEY  (\`${relation.foreignKey}\`) REFERENCES  \`${relation.relateTo}\` (\`${relation.foreignKey}\`); \n\n`;
			//console.log(querySQL)

			//se tiver mais de uma fk, gerar entra no loop para criar as outras
			if (relation.foreignKey.length > 1) {
				for (const foreignKey of relation.foreignKey) {
					querySQL += `ALTER TABLE \`${relation.currentTable}\` ADD CONSTRAINT \`Fk_${relation.currentTable}_${relation.relateTo}\`	FOREIGN KEY (\`${relation.foreignKey}\`) REFERENCES \`${relation.relateTo}\` (\`${relation.foreignKey}\`); \n\n`;
					//console.log(querySQL)

				}
			}
		}
	}
	const querysSQL = join(querySQL + '\n' + sql)
	//junta o .sql com o novo sql criado 

	console.log(querySQL)
	fs.writeFileSync('database_with_fks.sql', querysSQL);
	//escreve o novo sql no diretorio 
}


infoTable(createModifiedSqlScript('v1.sql'))
//createModifiedSqlScript ler o arquivo e retorna a strig, passando para o infotable
//passa o nome do arquivo que ira criar as chaves FKs




//tabela de referencia 
// Create Table
// 	If Not Exists `Niruu_App`.`User_Conquest` (
// 		`Id_User_Conquest` Int Not Null Auto_Increment,
// 		`Id_Conquest` Tinyint Not Null,
// 		`Id_User` Int Not Null,
// 		`Created_At` Timestamp Not Null Default Current_Timestamp(),
// 		`Updated_At` Timestamp Not Null Default Current_Timestamp(),
// 		Primary Key (`Id_User_Conquest`),
// 		Unique Index `Id_User_Conquest_Unique` (`Id_User_Conquest` Asc) Visible
// 	) Engine = Innodb Default Character
// Set
// 	= Utf8mb4;

// Create Table
// 	If Not Exists `Niruu_App`.`Magazine` (
// 		`Id_Magazine` Int Not Null Auto_Increment,
// 		`Romaji_Name` Varchar(256) Not Null,
// 		`Created_At` Timestamp Not Null Default Current_Timestamp(),
// 		`Updated_At` Timestamp Not Null Default Current_Timestamp(),
// 		Primary Key (`Id_Magazine`),
// 		Unique Index `Romaji_Name` (`Romaji_Name` Asc) Visible,
// 		Unique Index `Id_Magazine_Unique` (`Id_Magazine` Asc) Visible
// 	) Engine = Innodb Default Character
// Set
// 	= Utf8mb4;


//alter table de referencia
// ALTER TABLE `User_Conquest` ADD CONSTRAINT `Fk_User_Conquest_Conquest` FOREIGN KEY (`Id_Conquest`) REFERENCES `Conquest` (`Id_Conquest`);

// ALTER TABLE `User_Conquest` ADD CONSTRAINT `Fk_User_Conquest_User` FOREIGN KEY (`Id_User`) REFERENCES `User` (`Id_User`);

// ALTER TABLE `Magazine_Volume` ADD CONSTRAINT `Fk_Magazine_Volume_Magazine` FOREIGN KEY (`Id_Magazine`) REFERENCES `Magazine` (`Id_Magazine`);
