import { useEffect, useState } from 'react';
import mongoose from 'mongoose';
import Map from '@/models/Map';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '@/styles/MapPage.module.css'; // Import CSS module for styling
import formatNumber from '@/components/utils/fmtNumber';
import Navbar from '@/components/ui/navbar';
import Link from 'next/link';
import User from '@/models/User';
import msToTime from '@/components/msToTime';

export async function getServerSideProps(context) {
  const { slug } = context.params;
  const map = await Map.findOne({ slug }).lean();
  const authorId = map.created_by;
  const author = await User.findOne({ _id: authorId }).lean();
  map.created_by = author.username;
  map.created_at = msToTime(Date.now() - map.created_at);


  return {
    props: {
      mapData: JSON.parse(JSON.stringify(map))
    }
  };
}

export default function MapPage({ mapData }) {
  const router = useRouter();
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [locationUrls, setLocationUrls] = useState([]);
  const [fadeClass, setFadeClass] = useState(styles.iframe);

  useEffect(() => {
    // Generate the URLs for the iframe based on the map data
    const urls = mapData.data.map(location =>
      `//www.google.com/maps/embed/v1/streetview?key=AIzaSyA2fHNuyc768n9ZJLTrfbkWLNK3sLOK-iQ&location=${location.lat},${location.lng}&fov=60`
    );
    setLocationUrls(urls);

    // Cycle through the locations every 5 seconds
    const intervalId = setInterval(() => {
      setFadeClass(styles.iframe + ' ' + styles.fadeOut);
      setTimeout(() => {
        // setCurrentLocationIndex(prevIndex => (prevIndex + 1) % urls.length);
        // random locations
        setCurrentLocationIndex(Math.floor(Math.random() * urls.length));
        setFadeClass(styles.iframe + ' ' + styles.fadeIn);
      }, 1000); // Match with the CSS transition duration

    }, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [mapData.data]);

  const handlePlayButtonClick = () => {
    // Placeholder function for play button
    // router.push(`/?map=${mapData.slug}`);
    window.location.href = `/?map=${mapData.slug}`; // Redirect to game page
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>{mapData.name+" - Play Free on WorldGuessr"}</title>
        <meta name="description" content={`Explore ${mapData.name} on WorldGuessr, a free GeoGuessr clone. ${mapData.description_short}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <Navbar />

        <div className={styles.branding}>
          <h1>WorldGuessr</h1>
          <p>Your free GeoGuessr alternative.</p>
          {/* Back to Game */}
          <center>
          <Link href="/" className={styles.backButton}>
            ← Back to Game
          </Link>
          </center>
        </div>

        <div className={styles.mapHeader}>
          <div className={styles.mapImage}>
            {locationUrls.length > 0 && (
              <div className={styles.iframeContainer}>
                <iframe
                  className={fadeClass}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={locationUrls[currentLocationIndex]}
                ></iframe>
              </div>
            )}
          </div>
          <div className={styles.mapInfo}>
            <h1>{mapData.name}</h1>
            <p>{mapData.description_short}</p>
          </div>
        </div>

        <div className={styles.mapStats}>
          <div className={styles.stat}>
            <span className={styles.statIcon}>👥</span>
            <span className={styles.statValue}>{mapData.plays.toLocaleString()}</span>
            <span className={styles.statLabel}>Plays</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>📍</span>
            <span className={styles.statValue}>{formatNumber(mapData.data.length, 3)}</span>
            <span className={styles.statLabel}>Locations</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>❤️</span>
            <span className={styles.statValue}>{mapData.hearts.toLocaleString()}</span>
            <span className={styles.statLabel}>Hearts</span>
          </div>
        </div>

        <button className={styles.playButton} onClick={handlePlayButtonClick}>
          PLAY
        </button>

        <div className={styles.mapDescription}>
          <h2>About this map</h2>
          { mapData.description_long.split('\n').map((line, index) => <p key={index}>{line}</p>) }
          <p className={styles.mapAuthor}>
            Created by <strong>{mapData.created_by}</strong> {mapData.created_at} ago
            </p>
        </div>
      </main>
    </div>
  );
}
