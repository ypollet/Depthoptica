import { coreProviders, createProvider } from "optica-core"
import { DepthRepository } from "./repositories/depth_repository"

// Imported first by main.ts. The backend is the one of the environment (.env: VITE_BACKEND_TYPE, VITE_BACKEND_URL)
const repository = new DepthRepository(createProvider(coreProviders("depthoptica")))

export function getRepository(): DepthRepository {
    return repository
}
