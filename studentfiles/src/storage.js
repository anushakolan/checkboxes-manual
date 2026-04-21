const { TableClient, odata } = require('@azure/data-tables');

class StorageLayer {
    constructor() {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "UseDevelopmentStorage=true";
        const tableName = process.env.AZURE_STORAGE_TABLE_NAME || "checkboxes";
        
        this.client = TableClient.fromConnectionString(connectionString, tableName);
        this.partitionKey = "checkboxes";
    }

    async initialize() {
        // Create table if it doesn't exist
        await this.client.createTable();

        // Check if table is empty
        const entities = this.client.listEntities({
            queryOptions: { 
                filter: odata`PartitionKey eq ${this.partitionKey}` 
            }
        });
        
        let isEmpty = true;
        for await (const _ of entities) {
            isEmpty = false;
            break;
        }

        if (isEmpty) {
            await this.seedEntities();
        }
    }

    async seedEntities() {
        // Table storage max batch size is 100 operations.
        const numEntities = 1000;
        const batchSize = 100;

        for (let i = 0; i < numEntities; i += batchSize) {
            const batch = [];
            for (let j = 0; j < batchSize; j++) {
                const id = i + j;
                batch.push([
                    "create",
                    {
                        partitionKey: this.partitionKey,
                        rowKey: id.toString(),
                        IsChecked: false
                    }
                ]);
            }
            await this.client.submitTransaction(batch);
        }
    }

    async getAllCheckboxes() {
        const entities = this.client.listEntities({
            queryOptions: { 
                filter: odata`PartitionKey eq ${this.partitionKey}` 
            }
        });

        const checkboxes = [];
        for await (const entity of entities) {
            checkboxes.push({
                id: parseInt(entity.rowKey, 10),
                isChecked: entity.IsChecked,
                etag: entity.etag
            });
        }
        
        if (checkboxes.length === 0) {
            throw new Error("Storage empty - expected 1000 entities");
        }
        
        // Sort to ensure correct order
        checkboxes.sort((a, b) => a.id - b.id);
        
        return checkboxes;
    }

    async getCheckbox(id) {
        try {
            const entity = await this.client.getEntity(this.partitionKey, id.toString());
            return {
                id: parseInt(entity.rowKey, 10),
                isChecked: entity.IsChecked,
                etag: entity.etag
            };
        } catch (error) {
            if (error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }

    async updateCheckbox(id, isChecked, etag) {
        if (!etag) {
            const err = new Error("ETag is required for update operation");
            err.statusCode = 400; // Require if-match
            throw err;
        }
        
        try {
            const result = await this.client.updateEntity({
                partitionKey: this.partitionKey,
                rowKey: id.toString(),
                IsChecked: isChecked
            }, "Replace", { etag: etag });
            
            return {
                id,
                isChecked,
                etag: result.etag
            };
        } catch (error) {
            if (error.statusCode === 412) {
                const err = new Error("Precondition Failed. ETag mismatch.");
                err.statusCode = 412;
                throw err;
            }
            throw error;
        }
    }
}

module.exports = new StorageLayer();
