1. Favorecer la movilidad inteligente (csvs Trafico + PuntoMedida)

CSV PUNTOMEDIDA 
_______________

**Punto de medida:** es un lugar físico donde hay instalado un sensor de tráfico que mide continuamente el flujo de vehículos que pasan por ese tramo de carretera.

Explicación de una línea del csv
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 

**tipo_elem = "URB"** Tipo de Punto de Medida.
Hay dos posibles tipos:
→ *URB (urbano):* sensores ubicados en zonas de tráfico urbano, normalmente en semáforos o calles del centro.
→ *M30 (interurbano):* sensores situados en la M-30 o vías rápidas de acceso a la ciudad.
**distrito = 4** Código numérico del distrito donde se encuentra el punto de medida. Permite relacionar la ubicación del sensor con una zona administrativa de la ciudad.
**id = 3840** Identificador único y permanente del punto de medida. Este número es el que también aparece en el csv de Tráfico para vincular los datos de tráfico con su ubicación real.
**cod_cent = 27/09/1902 0:00** código centro de control al que pertenece el sensor y manda los datos. El día y la fecha no deberían de aparecer ahí. 
En algunos registros puede aparecer en formato de fecha u otro código según el sistema fuente.
**nombre = "Jose Ortega y Gasset E-O - Pº Castellana-Serrano"**  Denominación o nombre descriptivo del punto de medida. Normalmente incluye la calle y el sentido de la vía (por ejemplo, E-O = este-oeste) o el cruce entre dos calles. En este caso, el punto de medida se encuentra en la calle José Ortega y Gasset, en sentido este-oeste, a la altura del Paseo de la Castellana con Serrano.
**utm_x = 441615.343346657** Coordenada X en el sistema UTM (Universal Transverse Mercator), que indica la posición este-oeste del punto de medida en metros.
Se usa para localizar el sensor sobre un mapa en proyección UTM.
**utm_y = 4475767.9421385** Coordenada Y en el sistema UTM, que indica la posición norte-sur del punto de medida en metros. Junto con utm_x, define la ubicación exacta del sensor en el sistema de coordenadas planas UTM.
**longitud = -3.6883232754856** Coordenada geográfica de longitud (en grados decimales, sistema WGS84). Mide la posición este-oeste respecto al meridiano de Greenwich.
En este caso, el valor negativo indica que está al oeste de Greenwich (Madrid).
**latitud = 40.4305018691825** Coordenada geográfica de latitud (en grados decimales, sistema WGS84). Indica la posición norte-sur respecto al ecuador.


routes/PuntoMedida.js
- Obtener un punto concreto por id (HACER JOIN del id de archivo routes/Trafico.js en la función GET en el archivo dentro de routes de PuntoMedida): http://localhost:3000/puntomedida?id=1001
- Obtener todos los puntos URB: http://localhost:3000/puntomedida?tipo_elem=URB
- Obtener todos los puntos M30: http://localhost:3000/puntomedida?tipo_elem=M30
- Obtener los puntos de un distrito concreto: http://localhost:3000/puntomedida?distrito=4
- Filtrar por código de centralización (cod_cent): http://localhost:3000/puntomedida?cod_cent=27/09/1902 0:00   
- Buscar por nombre (contiene): http://localhost:3000/puntomedida?nombre=Recoletos
- Paginar los resultados: http://localhost:3000/puntomedida?limit=50&skip=0
- Ordenar por distrito o nombre: http://localhost:3000/puntomedida?sort=distrito  o  http://localhost:3000/puntomedida?sort=nombre


CSV TRÁFICO (todas las filas representan datos recogidos cada 15 minutos)
___________

Explicación de una línea del csv:
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _

- **id: 1001** --> Identificación única del Punto de Medida en los sistemas de control del tráfico. Ese número identifica al sensor de forma única. 
- **fecha: 2051-01-01 00:00:00** --> Los datos se registraron el 1 de enero de 2051 a las 00:00 horas.
- **tipo_elem = "M30"** --> Tipo de Punto de Medida.
Hay dos tipos de puntos de medida: 
--> *urbano:* sensores en ciudad.
--> *M30:* sensores interurbanos o de la vía de circunvalación M30.
- **intensidad = 264:** Número de vehículos por hora que pasan por el punto de medida durante el periodo de 15 minutos. Significa que se registraron 264 vehículos/hora (es una tasa, no el número exacto de vehículos).
- **ocupacion = 0** --> Porcentaje de tiempo durante el cual el sensor detecta que hay un vehículo encima (ocupación).En este caso 0% significa que el sensor no detectó vehículos ocupando el punto en ese momento (posible tráfico muy bajo o error).
**carga = 0** --> Grado de uso de la vía (0–100), teniendo en cuenta la intensidad, ocupación y capacidad. En este caso 0 → la vía estaba sin carga, es decir, no había tráfico relevante o no se registraron datos útiles.
- **vmed = 57** --> Velocidad media de los vehículos (en km/h) durante el periodo de 15 minutos. Significa que los vehículos circularon a una velocidad media de 57 km/h en ese intervalo.
- **error = N** --> Indicación de si hubo errores en las muestras durante el periodo de 15 minutos. 
N → No hubo errores ni sustituciones.
E → Algunos parámetros no son óptimos. 
S → Muestras totalmente erróneas, no se integraron. 
- **periodo_integracion = 5** --> Número de muestras recibidas y consideradas para ese periodo de integración. Significa que se recibieron 5 muestras válidas en esos 15 minutos (por ejemplo, una cada 3 minutos).

routes/Trafico.js
- Obtener solo lecturas del punto 1001: http://localhost:3000/trafico?idelem=1001 (FUNCIONA)
- Solo los datos del tipo URB: http://localhost:3000/trafico?tipo_elem=URB (FUNCIONA)
- Solo los datos del tipo M30: http://localhost:3000/trafico?tipo_elem=M30 (FUNCIONA)
- Datos de un rango de fechas: http://localhost:3000/trafico?desde=2051-01-01&hasta=2051-01-02 (FUNCIONA)
- Combinando varios filtros: http://localhost:3000/trafico?idelem=1001&tipo_elem=M30&desde=2051-01-01&hasta=2051-01-02 (FUNCIONA)
- Paginar los resultados: http://localhost:3000/trafico?limit=50&skip=100 (FUNCIONA)
________________________________________________________
- Filtrar por rango de intensidad: http://localhost:3000/trafico?intensidad_min=200&intensidad_max=800 (NO SÉ SI FUNCIONA BIEN)
- Filtrar por rango de carga: http://localhost:3000/trafico?carga_min=50&carga_max=90 
- Ordenar resultados por campo: http://localhost:3000/trafico?sort=-fecha o http://localhost:3000/trafico?sort=intensidad (NO FUNCIONA)
- Combinación completa de filtros: http://localhost:3000/trafico?idelem=1001&tipo_elem=M30&intensidad_min=300&desde=2051-01-01&hasta=2051-01-02&sort=-fecha&limit=100 (NO ESTOY SEGURA DE SI FUNCIONA BIEN)

2. Optimizar la gestión de residuos

CSV CONTENEDORES 
________________
