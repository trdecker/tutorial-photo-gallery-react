import { useState, useEffect } from 'react'
import { isPlatform } from '@ionic/react'

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export interface UserPhoto {
    filepath: string
    webviewPath?: string
}

const PHOTO_STORAGE = 'photos'

/**
 * 
 * @param path 
 * @description The base64FromPath method is a helper 
 * util that downloads a file from the supplied 
 * path and returns a base64 representation of that file.
 * @returns String
 */
export async function base64FromPath(path: string): Promise<String> {
    const response = await fetch(path)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = reject
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result)
            } else {
                reject('method did not return a string')
            }
        }
        reader.readAsDataURL(blob)
    })
}

/**
 * @description Any function that begins with the word "use" is a hook.
 * Hooks are functions that run when the function is rendering.
 * They should ONLY be used at the top level of a react function,
 * before any early returns, because once again,
 * they're meant to only be called WHEN THE FUNCTION IS RENDERING.
 * 
 * Don't call hooks within other functions!
 * 
 * The only exception are custom hooks (that's their whole purpose). 
 * Custom hooks are any function YOU create that begins with the
 * word "use". This works because custom Hooks are also supposed 
 * to only be called while a function component is rendering.
 * 
 * Therefore, with this function, it is a hook that is called on 
 * on rendering that creates a function (takePhoto) and an array
 * (photos).
 * 
 * Additionally, the function loads all the saved photos immediately
 * in the function loadSaved, which exists within a useEffect hook
 * (meaning it will render immediately when the usePhotoGallery)
 * @returns takePhoto, photos
 */
export function usePhotoGallery() {
    const [photos, setPhotos] = useState<UserPhoto[]>([])

    const savePicture = async (photo: Photo, fileName: string): Promise<UserPhoto> => {
        let base64Data: string
        // "hybrid" will detect Cordova or Capacitor (usually means mobile, or at least NOT WEB)
        if (isPlatform('hybrid')) {
            const file = await Filesystem.readFile({
                path: photo.path!
            })
            base64Data = file.data
        } else {
            base64Data = await base64FromPath(photo.webPath!) // This may display a type error. It will still run.
        }
        const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data, // This may also display a type error.
            directory: Directory.Data
        })

        // Display the new image
        if (isPlatform('hybrid')) {
            // Dislay new image by rewriting the 'file://' path to HTTP
            // Details: https://ionicframework.com/docs/building/webview#file-protocol
            return {
                filepath: savedFile.uri,
                webviewPath: Capacitor.convertFileSrc(savedFile.uri)
            }
        } else {
            // Use webPath to display new image instead of base64 since it's
            // already loaded into memory
            return {
                filepath: fileName,
                webviewPath: photo.webPath
            }
        }
    };

    const deletePhoto = async (photo: UserPhoto) => {
        // Remove this photo from the Photos reference data array
        const newPhotos = photos.filter((p) => p.filepath !== photo.filepath);

        // Update photos array cache by overwriting the existing photo array
        Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });

        // delete photo file from filesystem
        const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);
        await Filesystem.deleteFile({
            path: filename,
            directory: Directory.Data,
        });
        setPhotos(newPhotos);
    };

    const takePhoto = async () => {
        const photo = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100
        })

        const fileName = Date.now() + '.jpeg'
        const savedFileImage = await savePicture(photo, fileName)
        const newPhotos = [savedFileImage, ... photos]
        setPhotos(newPhotos)

        Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) })

    };

    /**
     * The useEffect hook, by default, gets called each time a 
     * component renders, unless, we pass in a dependency array. 
     * In that case, it will only run when a dependency gets 
     * updated. In our case we only want it to be called once. 
     * By passing in an empty array, which will not be changed, 
     * we can prevent the hook from being called multiple times.
     * 
     * The first parameter to useEffect is the function that will 
     * be called by the effect. We pass in an anonymous arrow 
     * function, and inside of it we define another asynchronous 
     * method and then immediately call this. We have to call the 
     * async function from within the hook __as the hook callback 
     * can't be asynchronous itself.__
     */
    useEffect(() => {
        const loadSaved = async () => {
            const { value } = await Preferences.get({ key: PHOTO_STORAGE })

            const photosInPreferences = (value ? JSON.parse(value) : []) as UserPhoto[]
            // For mobile, we can directly get each photo file on the Filesystem.
            // For web, we have to read each image into base64.
            if (!isPlatform('hybrid')) {
                for (let photo of photosInPreferences) {
                    const file = await Filesystem.readFile({
                        path: photo.filepath,
                        directory: Directory.Data
                    })
                    photo.webviewPath = `data:image/jpeg;base64,${file.data}`
                }
            }
            setPhotos(photosInPreferences)
        }
        loadSaved()
    }, [])

    return {
        /**
         * FROM TUTORIAL:
         * Notice the magic here: there's no
         *  platform-specific code (web, iOS, 
         * or Android)! The Capacitor Camera 
         * plugin abstracts that away for us, 
         * leaving just one method call
         * - getPhoto() - that will open up the
         *  device's camera and allow us to 
         * take photos.
         */
        takePhoto,
        deletePhoto,
        photos
    }
}


