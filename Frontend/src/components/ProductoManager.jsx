import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';

function ProductoManager() {
    const [productos, setProductos] = useState([]);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [imagenUrl, setImagenUrl] = useState('');
    const [disponible, setDisponible] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "productos"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProductos(list);
        });

        return () => unsubscribe();
    }, []);

    const agregarProducto = async () => {
        if (!nombre || !precio || !imagenUrl) return;
        await addDoc(collection(db, "productos"), {
            nombre,
            descripcion,
            precio: parseInt(precio),
            disponible,
            imagenUrl
        });
        setNombre('');
        setDescripcion('');
        setPrecio('');
        setImagenUrl('');
        setDisponible(true);
    };

    const eliminarProducto = async (id) => {
        await deleteDoc(doc(db, "productos", id));
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>🛒 Gestor de Productos</h2>

            <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} /><br />
            <input placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} /><br />
            <input placeholder="Precio" value={precio} onChange={e => setPrecio(e.target.value)} /><br />
            <input placeholder="URL de Imagen" value={imagenUrl} onChange={e => setImagenUrl(e.target.value)} /><br />
            <label>
                Disponible:
                <input type="checkbox" checked={disponible} onChange={() => setDisponible(!disponible)} />
            </label><br />

            <button onClick={agregarProducto}>Agregar Producto</button>

            <h3>📦 Inventario</h3>
            <ul>
                {productos.map(prod => (
                    <li key={prod.id}>
                        <strong>{prod.nombre}</strong> - ${prod.precio} 
                        {prod.imagenUrl && <img src={prod.imagenUrl} alt="" width="50" style={{ marginLeft: '10px' }} />}
                        <button onClick={() => eliminarProducto(prod.id)} style={{ marginLeft: '10px' }}>❌</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ProductoManager;
