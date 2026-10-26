import { OrthancProvider, ProviderFactory, RepositoryFactory } from "@optica/core"
import { DepthRepository } from "./repositories/depth_repository"

// Imported first by main.ts: the stores and components get the repository from the factories
ProviderFactory.register("ORTHANC", (url) => new OrthancProvider(url, "depthoptica"))
RepositoryFactory.register("DATA", (provider) => new DepthRepository(provider))

export function getRepository(): DepthRepository {
    return RepositoryFactory.get<DepthRepository>()
}
