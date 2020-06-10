import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import { FiArrowLeft } from 'react-icons/fi';

import Dropzone from '../../components/dropzone/index';

import api from '../../service/api';

import './styles.css';

import logo from '../../assets/logo.svg';
import Axios from 'axios';

interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface IBGEUFResponse {
    sigla: string;
}

interface IBGECityResponse {
    nome: string;
}

const CreatePoint = () => {

    const [items, setItems] = useState<Item[]>([]);
    const [UF, setUF] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');

    const [formData, setFormData] = useState({ name: '', email: '', whatssap: '' });

    const [initialPosition, setInitialPosition] = useState<[number, number]>
        ([-22.8255629, -47.2723987]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>
        ([-22.8255629, -47.2723987]);

    const [selectedItems, SetSelectedItems] = useState<number[]>([]);
    const [selectedFile, SetSelectedFile] = useState<File>();

    const history = useHistory();

    const handleSelectUf = (event: ChangeEvent<HTMLSelectElement>) => {
        const uf = event.target.value;
        setSelectedUf(uf);
    };

    const handleSelectCity = (event: ChangeEvent<HTMLSelectElement>) => {
        const city = event.target.value;
        setSelectedCity(city);
    };

    const handleMapClick = (event: LeafletMouseEvent) => {
        setSelectedPosition([event.latlng.lat, event.latlng.lng]);
    }

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setFormData({ ...formData, [name]: value })
    }

    const handleSelectItem = (id: number) => {
        const alreadySelected = selectedItems.findIndex(item => item === id);
        if (alreadySelected >= 0) {
            const filteredItems = selectedItems.filter(item => item !== id);
            SetSelectedItems(filteredItems);
        } else {
            SetSelectedItems([...selectedItems, id]);
        }
    }

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        const { name, email, whatssap } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = new FormData();

        data.append('name', name);
        data.append('email', email);
        data.append('whatssap', whatssap);
        data.append('uf', uf);
        data.append('city', city);
        data.append('latitude', String(latitude));
        data.append('longitude', String(longitude));
        data.append('items', items.join(','));
        
        if(selectedFile) {
            data.append('image', selectedFile);
        }

        // const data = { name, email, whatssap, uf, city, latitude, longitude, items };

        await api.post('points', data);

        alert('Ponto de coleta criado com Sucesso!');

        history.push('/');
    }

    useEffect(() => {

        api.get('items').then(res => {
            setItems(res.data);
        });

        Axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
            .then(res => {
                const ufInitials = res.data.map(uf => uf.sigla);

                setUF(ufInitials);
            });

        navigator.geolocation.getCurrentPosition(position => {
            if (position) {
                const { latitude, longitude } = position.coords;
                setInitialPosition([latitude, longitude]);
                setSelectedPosition([latitude, longitude]);
            }
        });

    }, []);

    useEffect(() => {
        if (selectedUf === '0') return;

        Axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
            .then(res => {
                const cityName = res.data.map(city => city.nome);

                setCities(cityName);
            });
    }, [selectedUf]);

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta" />

                <Link to="/">
                    <FiArrowLeft />
                    Voltar para Home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do ponto de coleta</h1>

                <Dropzone onFileUploaded={SetSelectedFile} />

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input type="text" name="name" id="name" onChange={handleInputChange} />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="text" name="email" id="email" onChange={handleInputChange} />
                        </div>
                        <div className="field">
                            <label htmlFor="whatssap">Whatssap</label>
                            <input type="text" name="whatssap" id="whatssap" onChange={handleInputChange} />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" onChange={handleSelectUf} value={selectedUf}>
                                <option value="0"></option>
                                {UF.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" onChange={handleSelectCity} value={selectedCity}>
                                <option value="0">Selecione uma Cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Itens de Coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                            <li key={item.id} onClick={() => handleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? `selected` : ''}>
                                <img src={item.image_url} alt={item.title} />
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    )
}

export default CreatePoint;