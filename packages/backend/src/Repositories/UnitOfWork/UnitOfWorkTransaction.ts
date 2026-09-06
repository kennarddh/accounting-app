import { Prisma } from 'PrismaGenerated/client'

class UnitOfWorkTransaction {
	constructor(private tx: Prisma.TransactionClient) {}

	getRepository<T>(repositoryType: new (prisma: Prisma.TransactionClient) => T): T {
		return new repositoryType(this.tx)
	}
}

export default UnitOfWorkTransaction
