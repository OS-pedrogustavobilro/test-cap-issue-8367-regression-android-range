import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Capacitor Issue #8367</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Test App</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Range Request Regression Test</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>
              This app tests the range request regression introduced in Capacitor 8.1.1-nightly.
            </p>
            <p>
              <strong>Issue:</strong> <a href="https://github.com/ionic-team/capacitor/issues/8367" target="_blank" rel="noopener noreferrer">
                capacitor#8367
              </a>
            </p>
            <IonButton
              expand="block"
              onClick={() => history.push('/range-test')}
              style={{ marginTop: '16px' }}
            >
              Open Range Request Test
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Home;
