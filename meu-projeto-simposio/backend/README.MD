## 🚀 Como rodar o projeto

Certifique-se de ter o Docker e o Docker Compose instalados na sua máquina. Para construir as imagens e iniciar os contêineres em segundo plano, abra o terminal na pasta do projeto e execute:

```bash
docker-compose up -d --build


docker exec -it simposio_db mysql -u root -proot simposio_db