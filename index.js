const IBM = require('ibm-cos-sdk');
const sharp = require('sharp');

// Configuración de las credenciales de IBM Cloud Object Storage
const cosConfig = {
    endpoint: 'https://s3.eu-es.cloud-object-storage.appdomain.cloud',
    apiKeyId: 'API_KEY',
    serviceInstanceId: 'CRN_INSTANCE_ID'
};

// Crear una instancia de IBM Cloud Object Storage
const cos = new IBM.S3(cosConfig);

// Configuración de las opciones de redimensionamiento
const resizeOptions = {
    width: 200,
    height: 200
};

// Función para redimensionar una imagen y subirla al bucket 'target'
async function resizeImage(key) {
    const params = {
        Bucket: 'origin',
        Key: key
    };

    const imageObject = await cos.getObject(params).promise();

    const resizedImage = await sharp(imageObject.Body)
        .resize(resizeOptions.width, resizeOptions.height)
        .toBuffer();

    const targetParams = {
        Bucket: 'target',
        Key: `resized-${key}`,
        Body: resizedImage,
        ContentType: 'image/jpeg' // Ajustar según sea necesario
    };

    await cos.putObject(targetParams).promise();

    console.log(`Imagen redimensionada subida a: resized-${key}`);
}

// Función para obtener una lista de objetos en el bucket 'origin'
async function getBucketContents() {
    console.log('Retrieving bucket contents from: origin');
    const data = await cos.listObjects({Bucket: 'origin'}).promise();
    if (data && data.Contents) {
        data.Contents.forEach((item) => {
            console.log(`Item: ${item.Key} (${item.Size} bytes).`);
        });
    }
    return data.Contents;
}

// Función principal para procesar las imágenes
async function main() {
    const objects = await getBucketContents();
    if (objects && objects.length > 0) {
        for (const obj of objects) {
            if (obj.Key.endsWith('.jpg') || obj.Key.endsWith('.jpeg') || obj.Key.endsWith('.png')) {
                await resizeImage(obj.Key);
            }
        }
    }
}

main();
