import { camera, trash, close } from 'ionicons/icons';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonActionSheet,
} from '@ionic/react';
import { usePhotoGallery, UserPhoto } from '../hooks/usePhotoGallery_new'
import { useState } from 'react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab1.css';


const Tab1: React.FC = () => {

  const { photos, takePhoto, deletePhoto } = usePhotoGallery()
  const [photoToDelete, setPhotoToDelete] = useState<UserPhoto>();

  return (
    <IonPage>
      <IonHeader>
        {/* Top navigation and toolbar */}
        <IonToolbar>
          <IonTitle>Photo Gallery</IonTitle>
        </IonToolbar>
      </IonHeader>
      {/* The stuff we'll see in the screen */}
      <IonContent>
        {/* Our displayed photos */}
        <IonRow>
          {photos.map((photo, _index) => (
            <IonCol size="6" key={photo.filepath}>
              {/* <IonImg src={photo.webviewPath} /> */}
              <IonImg onClick={() => setPhotoToDelete(photo)} src={photo.webviewPath} />
            </IonCol>
          ))}
        </IonRow>
        {/* Take photo button */}
        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton onClick={() => takePhoto()} >
            <IonIcon icon={camera}></IonIcon>
          </IonFabButton>
        </IonFab>
        {/* Delete photo action sheet */}
        <IonActionSheet
          isOpen={!!photoToDelete}
          buttons={[
            {
              text: 'Delete',
              role: 'destructive',
              icon: trash,
              handler: () => {
                if (photoToDelete) {
                  deletePhoto(photoToDelete);
                  setPhotoToDelete(undefined);
                }
              },
            },
            {
              text: 'Cancel',
              icon: close,
              role: 'cancel', // What does "role" mean?
            },
          ]}
          onDidDismiss={() => setPhotoToDelete(undefined)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
