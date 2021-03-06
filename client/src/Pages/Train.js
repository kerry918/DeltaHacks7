import React, { useRef, useState } from 'react';

import Button from '@material-ui/core/Button';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import GetAppIcon from '@material-ui/icons/GetAppOutlined';
import Navigation from '../Components/Navigation/Navigation';
import TextField from '@material-ui/core/TextField';
import VideoFrame from '../Components/VideoFrame';
import { useAuth } from '../Contexts/AuthContext';
import useStyles from './Train-jss';

const Train = () => {
  let identity = 0;
  var classes = [];
  const classesStyles = useStyles();
  const inputEl = useRef(null);
  const { currentUser } = useAuth();
  const [predictionText, setPredictionText] = useState('');

  const start = async () => {
    const trainingCards = document.getElementById('training-cards');
    const predictions = document.getElementById('predictionsUser');
    const confidence = document.getElementById('confidence');

    const createKNNClassifier = async () => {
      console.log('Loading KNN Classifier');
      return await window.knnClassifier.create();
    };
    const createMobileNetModel = async () => {
      console.log('Loading Mobilenet Model');
      return await window.mobilenet.load();
    };
    const createWebcamInput = async () => {
      console.log('Loading Webcam Input');
      const webcamElement = await document.getElementById('webcam');
      return await window.tf.data.webcam(webcamElement);
    };

    const mobilenetModel = await createMobileNetModel();
    const knnClassifierModel = await createKNNClassifier();
    const webcamInput = await createWebcamInput();
    var preloader = document.getElementById('loading');

    function preLoader() {
      preloader.style.display = 'none';
    }
    preLoader();

    const addClass = () => {
      const inputClassName = document.getElementById('inputClassName');

      let Classname = inputClassName.value;
      const found = classes.some((el) => el.name === Classname);
      if (!found) {
        identity += 1;
        classes.push({ id: identity, name: Classname, count: 0 });
      }

      trainingCards.innerHTML +=
        `<div class=${classesStyles.classCard}><div class=${classesStyles.cardText}><div class=${classesStyles.classNameLabel}> Word : <span>` +
        Classname +
        `</span></div><div class=${classesStyles.imageNameLabel}>Images : <span id = "images-` +
        identity +
        `" >0</span></div></div ><div><button class=${classesStyles.addImage} id="` +
        identity +
        '">Add Image <i class="fas fa-plus fa-1x"></i></button></div></div>';

      document
        .getElementById(identity.toString())
        .addEventListener('click', () => addDatasetClass(identity));
      inputClassName.value = '';
      console.log(classes);
    };

    const initializeElements = () => {
      const inputClassName = document.getElementById('inputClassName').value;
      document
        .getElementById('add-button')
        .addEventListener('click', () => addClass(inputClassName));
      // document.getElementById('btnSpeak').addEventListener('click', () => speak());
      // document.getElementById('load_button').addEventListener('change', (event) => uploadModel(knnClassifierModel, event));
      document
        .getElementById('save_button')
        .addEventListener('click', async () => downloadModel(knnClassifierModel));
    };

    const addDatasetClass = async (classId) => {
      // Capture an image from the web camera.
      const img = await webcamInput.capture();

      // Get the intermediate activation of MobileNet 'conv_preds' and pass that
      // to the KNN classifier.
      const activation = mobilenetModel.infer(img, 'conv_preds');

      // Pass the intermediate activation to the classifier.
      knnClassifierModel.addExample(activation, classId);

      let classIndex = classes.findIndex((el) => el.id === classId);
      let currentCount = classes[classIndex].count;
      currentCount += 1;
      classes[classIndex].count = currentCount;

      var temp_id = 'images-' + classId.toString();
      document.getElementById(temp_id).innerHTML = currentCount;

      // Dispose the tensor to release the memory.
      img.dispose();
    };

    const imageClassificationWithTransferLearningOnWebcam = async () => {
      console.log('Machine Learning on the web is ready');
      while (true) {
        if (knnClassifierModel.getNumClasses() > 0) {
          const img = await webcamInput.capture();

          // Get the activation from mobilenet from the webcam.
          const activation = mobilenetModel.infer(img, 'conv_preds');
          // Get the most likely class and confidences from the classifier module.
          const result = await knnClassifierModel.predictClass(activation);

          //console.log(classes[result.label - 1].name)
          let text;
          try {
            predictions.innerHTML = classes[result.label - 1].name;
            text = classes[result.label - 1].name;
            confidence.innerHTML = Math.floor(result.confidences[result.label] * 100);
            document.getElementById('change-prediction-train').click();
          } catch (err) {
            predictions.innerHTML = result.label - 1;
            text = result.label - 1;
            confidence.innerHTML = Math.floor(result.confidences[result.label] * 100);
          }
          if (text !== predictionText) {
            setPredictionText(text);
          }
          // Dispose the tensor to release the memory.
          img.dispose();
        }
        await window.tf.nextFrame();
      }
    };

    await initializeElements();
    await imageClassificationWithTransferLearningOnWebcam();
  };

  const saveClassifier = (classifierModel) => {
    let datasets = classifierModel.getClassifierDataset();
    let datasetObject = {};
    Object.keys(datasets).forEach((key) => {
      let data = datasets[key].dataSync();
      datasetObject[key] = Array.from(data);
    });
    let jsonModel = JSON.stringify(datasetObject);
    console.log(jsonModel);
    let downloader = document.createElement('a');
    downloader.download = 'model.json';
    downloader.href = 'data:text/text;charset=utf-8,' + encodeURIComponent(jsonModel);
    document.body.appendChild(downloader);
    downloader.click();
    downloader.remove();
  };

  window.onload = async () => {
    await start();
  };

  const downloadModel = async (classifierModel) => {
    await saveClassifier(classifierModel);
  };

  return (
    <>
      <div id="loading"></div>
      <Navigation />
      <div className={classesStyles.background}>
        <div className={classesStyles.videoContainer}>
          <div className={classesStyles.downloadButtonSet}>
            <Button
              id="save_button"
              color="primary"
              variant="outlined"
              className={classesStyles.downloadBtn}
              startIcon={<GetAppIcon />}
            >
              Download Model
            </Button>
            <Button
              variant="outlined"
              color="primary"
              className={classesStyles.downloadBtn}
              startIcon={<CloudUploadIcon />}
              onClick={() => inputEl.current.click()}
            >
              Upload
            </Button>
            <input
              ref={inputEl}
              id="load_button"
              className="fileinputs"
              type="file"
              accept=".json"
              style={{ display: 'none' }}
            ></input>
          </div>
          <div>
            <VideoFrame id="predictionsUser" prediction={predictionText} />
          </div>
        </div>
        <div className={classesStyles.chatContainer}>
          <div className="column flex-2-container">
            <div>
              <div className={classesStyles.addClass}>
                <input
                  id="inputClassName"
                  type="text"
                  placeholder="Enter word here"
                  name="option"
                  className={classesStyles.inputField}
                  autoComplete="off"
                />
                <Button
                  variant="contained"
                  color="primary"
                  className={classesStyles.addButton}
                  id="add-button"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
          <div id="training-cards" className={classesStyles.trainingCards}></div>
          <button hidden id="change-prediction-train"></button>
        </div>
      </div>
    </>
  );
};

export default Train;
