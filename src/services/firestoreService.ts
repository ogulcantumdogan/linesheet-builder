import { db } from '../firebase'
import { 
  doc, collection, getDocs, getDoc, setDoc, deleteDoc, 
  query, orderBy, Timestamp
} from 'firebase/firestore'
import type { DocumentData } from 'firebase/firestore'
import type { LineSheetProject, Product } from '../stores/linesheet'

// Collection references
const PROJECTS_COLLECTION = 'projects'

/**
 * Convert Firestore date fields back to JavaScript Date objects
 */
function convertTimestamps(data: any): any {
  if (!data) return data
  
  const result = { ...data }
  
  if (result.createdAt && result.createdAt instanceof Timestamp) {
    result.createdAt = result.createdAt.toDate()
  }
  
  return result
}

/**
 * Prepares data for Firestore by handling Date objects
 */
function prepareForFirestore(data: any): any {
  if (!data) return data
  
  const result = { ...data }
  
  // Convert Date objects to Firestore Timestamps
  if (result.createdAt && result.createdAt instanceof Date) {
    result.createdAt = Timestamp.fromDate(result.createdAt)
  }
  
  return result
}

/**
 * Fetch all projects for the user
 */
export async function getProjects(): Promise<LineSheetProject[]> {
  try {
    const projectsRef = collection(db, PROJECTS_COLLECTION)
    const q = query(projectsRef, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const projects: LineSheetProject[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      projects.push({
        ...convertTimestamps(data),
        id: doc.id
      } as LineSheetProject)
    })
    
    return projects
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

/**
 * Fetch a single project by ID
 */
export async function getProject(id: string): Promise<LineSheetProject | null> {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, id)
    const projectSnap = await getDoc(projectRef)
    
    if (projectSnap.exists()) {
      const data = projectSnap.data()
      return {
        ...convertTimestamps(data),
        id: projectSnap.id
      } as LineSheetProject
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error)
    return null
  }
}

/**
 * Save a project to Firestore
 */
export async function saveProject(project: LineSheetProject): Promise<boolean> {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, project.id)
    
    // Prepare data for Firestore
    const projectData = prepareForFirestore(project)
    
    await setDoc(projectRef, projectData)
    return true
  } catch (error) {
    console.error('Error saving project:', error)
    return false
  }
}

/**
 * Delete a project from Firestore
 */
export async function deleteProject(id: string): Promise<boolean> {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, id)
    await deleteDoc(projectRef)
    return true
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error)
    return false
  }
} 